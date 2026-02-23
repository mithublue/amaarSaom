/**
 * POST /api/cron/master-notification
 *
 * Single master endpoint called by cron-job.org every 5 minutes.
 * Handles two conditions: 
 *   1. Prayer Reminder: check if any prayer was 15-20 min ago → send per-user push
 *   2. Leaderboard Motivation: check if it's the user's configured daily time → send competitive push
 *
 * Security: Requires X-Cron-Secret header matching CRON_SECRET env var.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendPushToUser, sendPushNotification } from '@/lib/firebase/firebaseAdmin';
import {
    fetchPrayerTimes,
    getPrayerToRemind,
    getPrayerNotificationText,
    PrayerName,
} from '@/lib/notifications/prayerScheduler';

// ── In-memory dedup (per-instance, good enough for single Vercel function) ──
const prayerSentCache = new Map<string, number>();   // key: `${userId}-${prayer}`
const leaderboardSentCache = new Map<number, number>(); // key: userId
const PRAYER_DEDUP_MS = 30 * 60 * 1000;    // 30 min — prevents double-sends
const LEADERBOARD_DEDUP_MS = 23 * 60 * 60 * 1000; // 23 hrs — once per day

function prayerWasSent(userId: number, prayer: PrayerName): boolean {
    const key = `${userId}-${prayer}`;
    const t = prayerSentCache.get(key);
    if (!t) return false;
    if (Date.now() - t > PRAYER_DEDUP_MS) { prayerSentCache.delete(key); return false; }
    return true;
}
function markPrayerSent(userId: number, prayer: PrayerName) {
    prayerSentCache.set(`${userId}-${prayer}`, Date.now());
}
function leaderboardWasSent(userId: number): boolean {
    const t = leaderboardSentCache.get(userId);
    if (!t) return false;
    if (Date.now() - t > LEADERBOARD_DEDUP_MS) { leaderboardSentCache.delete(userId); return false; }
    return true;
}

/** Get hour + minute in a given timezone */
function localTime(tz: string): { h: number; m: number } {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false });
    const parts = fmt.formatToParts(now);
    return {
        h: parseInt(parts.find(p => p.type === 'hour')?.value ?? '0'),
        m: parseInt(parts.find(p => p.type === 'minute')?.value ?? '0'),
    };
}

/** Map prayer name to preference key */
const PRAYER_PREF_KEY: Record<PrayerName, string> = {
    Fajr: 'fajrReminder',
    Dhuhr: 'dhuhrReminder',
    Asr: 'asrReminder',
    Maghrib: 'maghribReminder',
    Isha: 'ishaReminder',
};

/** Build leaderboard motivation message */
function buildLeaderboardMsg(
    competitorName: string,
    pointDiff: number,
    deedName: string,
    lang: string
): { title: string; body: string } {
    const n = competitorName.split(' ')[0] || competitorName; // first name only
    if (lang === 'bn') return {
        title: '🏆 ধরে ফেলো!',
        body: `${n} তোমার চেয়ে ${pointDiff} পয়েন্টে এগিয়ে! এখনই "${deedName}" করে তাকে ছাড়িয়ে যাও।`,
    };
    if (lang === 'ar') return {
        title: '🏆 اللحاق به!',
        body: `${n} يتقدمك بـ${pointDiff} نقطة! ابدأ "${deedName}" الآن.`,
    };
    return {
        title: '🏆 Catch up now!',
        body: `${n} is ${pointDiff} pts ahead! Do "${deedName}" to take the lead.`,
    };
}

export async function POST(req: NextRequest) {
    // Validate cron secret
    const secret = req.headers.get('x-cron-secret');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Fetch global system settings
        const sysSettings = await prisma.systemSettings.findFirst();
        const globalPrayerEnabled = sysSettings?.globalPrayerNotifications !== false;
        const globalLeaderboardEnabled = sysSettings?.globalLeaderboardNotifications !== false;

        const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';
        const isTest = req.nextUrl.searchParams.get('test') === 'true';
        const stats = { prayerCount: 0, leaderboardCount: 0, prayerSent: 0, leaderboardSent: 0 };
        const debugLogs: string[] = [];

        // ── Load all subscribed users (Logged In) ──
        let loggedInUsers = (await prisma.user.findMany({
            where: { pushSubscriptions: { some: {} } },
            include: { notificationPrefs: true },
        })) as any[];

        // ── Load anonymous subscriptions ──
        const anonSubs = (await prisma.pushSubscription.findMany({
            where: { userId: null as any },
        })) as any[];

        // ── Test Mode Filter ──
        if (isTest) {
            const adminEmail = process.env.ADMIN_EMAIL || 'mithun.m82@gmail.com';
            loggedInUsers = loggedInUsers.filter(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
            debugLogs.push(`Test mode: limited to admin (${adminEmail})`);
        }

        if (loggedInUsers.length === 0 && anonSubs.length === 0) {
            return NextResponse.json({ success: true, message: 'No active subscriptions found', ...stats, debugLogs });
        }

        // ── Load random good deeds for CTA ──
        const deeds = await prisma.predefinedGoodDeed.findMany({
            where: { isActive: true },
            select: { nameEn: true, nameBn: true, nameAr: true },
            take: 30,
        });
        const randomDeed = (lang: string) => {
            if (!deeds.length) return 'morning dhikr';
            const d = deeds[Math.floor(Math.random() * deeds.length)];
            return lang === 'bn' ? (d.nameBn ?? d.nameEn) : lang === 'ar' ? (d.nameAr ?? d.nameEn) : d.nameEn;
        };

        // ── Fetch weekly leaderboard ──
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weeklyBoard = (await prisma.leaderboardCache.findMany({
            where: { period: 'week' as any, date: { gte: weekStart }, rank: { not: null } },
            orderBy: { rank: 'asc' },
            select: { userId: true, totalPoints: true, rank: true },
        })) as any[];

        const boardIndex = new Map<number, { rank: number; points: number }>();
        for (const r of weeklyBoard) {
            if (r.rank !== null) {
                boardIndex.set(r.userId, { rank: r.rank, points: r.totalPoints });
            }
        }

        const prayerCache = new Map<string, Record<PrayerName, string> | null>();

        // 1. Process Logged-in Users
        for (const user of loggedInUsers) {
            const lang = user.preferredLanguage || 'en';
            const tz = user.timezone || 'Asia/Dhaka';
            const prefs = user.notificationPrefs;

            if (globalPrayerEnabled) {
                const city = user.cityName || 'Dhaka';
                const country = user.countryName || 'Bangladesh';
                const cacheKey = `${city}|${country}`;
                if (!prayerCache.has(cacheKey)) prayerCache.set(cacheKey, await fetchPrayerTimes(city, country));
                const times = prayerCache.get(cacheKey);
                if (times) {
                    const prayer = getPrayerToRemind(times, tz);
                    const effectivePrayer = prayer || (isTest ? 'Dhuhr' : null);
                    if (effectivePrayer) {
                        const prefKey = PRAYER_PREF_KEY[effectivePrayer as PrayerName];
                        const enabled = !prefs || (prefs as any)[prefKey] !== false;
                        if (enabled && (isTest || !prayerWasSent(user.id, effectivePrayer as PrayerName))) {
                            const { title, body } = getPrayerNotificationText(effectivePrayer as PrayerName, lang);
                            if (!dryRun) {
                                await sendPushToUser(user.id, title, body, { type: 'prayer_reminder', prayer: effectivePrayer });
                                if (!isTest) markPrayerSent(user.id, effectivePrayer as PrayerName);
                            }
                            stats.prayerSent++;
                            debugLogs.push(`Sent prayer(${effectivePrayer}) to user ${user.email}`);
                        }
                    }
                }
            }

            if (globalLeaderboardEnabled) {
                const leaderboardEnabled = !prefs || prefs.leaderboardMotivation;
                if (leaderboardEnabled && (isTest || !leaderboardWasSent(user.id))) {
                    const { h, m } = localTime(tz);
                    const nowMin = h * 60 + m;
                    const prefH = prefs?.leaderboardHour ?? 20;
                    const prefM = prefs?.leaderboardMinute ?? 0;
                    if (isTest || Math.abs(nowMin - (prefH * 60 + prefM)) <= 7) {
                        const myEntry = boardIndex.get(user.id);
                        if (isTest || (myEntry && (myEntry.rank as number) > 1)) {
                            let above = myEntry ? weeklyBoard.find((r: any) => r.rank === (myEntry.rank as number) - 1) : null;
                            if (isTest && !above && weeklyBoard.length > 0) above = weeklyBoard[0];

                            if (above || isTest) {
                                const competitorName = (above as any)?.user?.name || 'A fellow user';
                                const pointDiff = Math.max(10, (above?.totalPoints || 100) - (myEntry?.points || 0));
                                const deed = randomDeed(lang);
                                const { title, body } = buildLeaderboardMsg(competitorName, pointDiff, deed, lang);
                                if (!dryRun) {
                                    await sendPushToUser(user.id, title, body, { type: 'leaderboard_motivation' });
                                    if (!isTest) leaderboardSentCache.set(user.id, Date.now());
                                }
                                stats.leaderboardSent++;
                            }
                        }
                    }
                }
            }
        }

        // 2. Process Anonymous Subscriptions
        for (const sub of anonSubs) {
            const lang = sub.language || 'bn';
            const tz = sub.timezone || 'Asia/Dhaka';

            if (globalPrayerEnabled) {
                const city = sub.cityName || 'Dhaka';
                const country = sub.countryName || 'Bangladesh';
                const cacheKey = `${city}|${country}`;
                if (!prayerCache.has(cacheKey)) prayerCache.set(cacheKey, await fetchPrayerTimes(city, country));
                const times = prayerCache.get(cacheKey);

                if (times) {
                    const prayer = getPrayerToRemind(times, tz);
                    const effectivePrayer = prayer || (isTest ? 'Dhuhr' : null);
                    if (effectivePrayer) {
                        const cacheId = `anon-${sub.id}-${effectivePrayer}`;
                        const alreadySent = !isTest && prayerSentCache.get(cacheId) && (Date.now() - (prayerSentCache.get(cacheId) || 0) < PRAYER_DEDUP_MS);

                        if (isTest || !alreadySent) {
                            const { title, body } = getPrayerNotificationText(effectivePrayer as PrayerName, lang);
                            if (!dryRun) {
                                await sendPushNotification([sub.token], title, body, { type: 'prayer_reminder', prayer: effectivePrayer });
                                if (!isTest) prayerSentCache.set(cacheId, Date.now());
                            }
                            stats.prayerSent++;
                            debugLogs.push(`Sent prayer(${effectivePrayer}) to anonymous sub #${sub.id} (${city})`);
                        }
                    }
                }
            }
        }

        // 3. Custom Admin Notifications
        const now = new Date();
        const pendingNotifs = await prisma.customNotification.findMany({
            where: { isSent: false, scheduledAt: { lte: now } }
        });

        for (const notif of pendingNotifs) {
            const emails = notif.receiverEmails.split(',').map(e => e.trim().toLowerCase());
            const targetUsers = await prisma.user.findMany({
                where: { email: { in: emails } },
                select: { id: true, email: true }
            });

            for (const target of targetUsers) {
                try {
                    await sendPushToUser(target.id, notif.title, notif.content, {
                        type: 'custom_admin_notification',
                        notifId: notif.id.toString()
                    });
                } catch (err) {
                    console.error(`Failed to send custom notif to ${target.email}:`, err);
                }
            }
            await prisma.customNotification.update({ where: { id: notif.id }, data: { isSent: true } });
        }

        return NextResponse.json({ success: true, dryRun, ...stats, customNotifsSent: pendingNotifs.length, debugLogs });

    } catch (error: any) {
        console.error('Master notification error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

export { POST as GET };
