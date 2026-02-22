/**
 * POST /api/notifications/leaderboard-reminder
 * Vercel Cron: every 30 minutes
 * For each user with leaderboard motivation enabled:
 *   - Check if current time (in their timezone) matches their preferred leaderboard notification time (±15 min)
 *   - Find the user 1-2 ranks above them on the weekly leaderboard
 *   - Send a motivational FCM push
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendPushToUser } from '@/lib/firebase/firebaseAdmin';

// In-memory dedup: prevent repeat sends within 23 hours
const sentCache = new Map<number, number>();
const DEDUP_TTL_MS = 23 * 60 * 60 * 1000;

function wasSentToday(userId: number): boolean {
    const last = sentCache.get(userId);
    if (!last) return false;
    if (Date.now() - last > DEDUP_TTL_MS) { sentCache.delete(userId); return false; }
    return true;
}

/** Get the current hour + minute in a given timezone */
function localTime(tz: string): { h: number; m: number } {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false });
    const parts = fmt.formatToParts(now);
    return {
        h: parseInt(parts.find(p => p.type === 'hour')?.value ?? '0'),
        m: parseInt(parts.find(p => p.type === 'minute')?.value ?? '0'),
    };
}

/** Motivational message templates */
function buildMessage(
    competitorName: string,
    pointDiff: number,
    deedName: string,
    lang: string
): { title: string; body: string } {
    if (lang === 'bn') return {
        title: '🏆 ধরে ফেলো তাকে!',
        body: `${competitorName} তোমার চেয়ে ${pointDiff} পয়েন্টে এগিয়ে! এখনই "${deedName}" শুরু করে তাকে ছাড়িয়ে যাও।`,
    };
    if (lang === 'ar') return {
        title: '🏆 اللحاق به الآن!',
        body: `${competitorName} يتقدمك بـ${pointDiff} نقطة! ابدأ "${deedName}" الآن للتفوق عليه.`,
    };
    return {
        title: '🏆 Catch up now!',
        body: `${competitorName} is ${pointDiff} points ahead of you! Start "${deedName}" now to take the lead.`,
    };
}

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';

    // Get today's date for weekly leaderboard scope
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Weekly leaderboard: ranked entries for this week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday

    const weeklyBoard = await (prisma as any).leaderboardCache.findMany({
        where: {
            period: 'week',
            date: { gte: weekStart },
            rank: { not: null },
        },
        orderBy: { rank: 'asc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    timezone: true,
                    preferredLanguage: true,
                    pushSubscriptions: { select: { token: true }, take: 1 },
                    notificationPrefs: {
                        select: { leaderboardMotivation: true, leaderboardHour: true, leaderboardMinute: true },
                    },
                },
            },
        },
    });

    // Pick a random deed name for the CTA
    const deeds = await (prisma as any).predefinedGoodDeed.findMany({
        where: { isActive: true },
        select: { nameEn: true, nameBn: true, nameAr: true },
        take: 20,
    });
    const randomDeed = deeds.length > 0 ? deeds[Math.floor(Math.random() * deeds.length)] : null;

    const notified: { userId: number; sent: boolean }[] = [];

    for (let i = 0; i < weeklyBoard.length; i++) {
        const entry = weeklyBoard[i];
        const user = entry.user;
        if (!user || user.pushSubscriptions.length === 0) continue;

        const prefs = user.notificationPrefs;
        if (prefs && !prefs.leaderboardMotivation) continue;

        if (wasSentToday(user.id)) continue;

        // Check if current local time matches the user's configured time (±15 min)
        const { h, m } = localTime(user.timezone || 'Asia/Dhaka');
        const nowMin = h * 60 + m;
        const prefH = prefs?.leaderboardHour ?? 20;
        const prefM = prefs?.leaderboardMinute ?? 0;
        const targetMin = prefH * 60 + prefM;
        if (Math.abs(nowMin - targetMin) > 15) continue;

        // Find 1-2 ranks above
        const above = weeklyBoard[Math.max(0, i - 2)];
        if (!above || above.user.id === user.id) continue;

        const pointDiff = above.totalPoints - entry.totalPoints;
        if (pointDiff <= 0) continue;

        const lang = user.preferredLanguage || 'en';
        const deedName = randomDeed
            ? (lang === 'bn' ? randomDeed.nameBn : lang === 'ar' ? randomDeed.nameAr : randomDeed.nameEn)
            : 'morning dhikr';

        const { title, body } = buildMessage(above.user.name || 'Someone', pointDiff, deedName, lang);

        if (!dryRun) {
            await sendPushToUser(user.id, title, body, {
                type: 'leaderboard_motivation',
                competitorId: String(above.user.id),
            });
            sentCache.set(user.id, Date.now());
        }

        notified.push({ userId: user.id, sent: !dryRun });
    }

    return NextResponse.json({ success: true, dryRun, notified: notified.length, results: notified });
}

export { POST as GET };
