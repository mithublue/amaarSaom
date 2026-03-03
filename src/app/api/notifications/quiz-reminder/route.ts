/**
 * POST /api/notifications/quiz-reminder
 * Vercel Cron: every 30 minutes
 *
 * For each user who has quizReminder enabled:
 *   - Check if current local time matches their preferred quiz notification time (±15 min)
 *   - Check if user has NOT already played today's quiz (completedAt is set today)
 *   - Send an FCM push nudging them to play the daily Brain Battle
 *
 * NOTE: quizReminder, quizHour, quizMinute were added to NotificationPreferences
 * but may not yet be in the generated Prisma client types; using `as any` casts.
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

function localTime(tz: string): { h: number; m: number } {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    });
    const parts = fmt.formatToParts(now);
    return {
        h: parseInt(parts.find(p => p.type === 'hour')?.value ?? '0'),
        m: parseInt(parts.find(p => p.type === 'minute')?.value ?? '0'),
    };
}

function buildMessage(lang: string, streak: number): { title: string; body: string } {
    if (lang === 'bn') {
        const streakText = streak > 1 ? ` 🔥 ${streak} দিনের স্ট্রিক ধরে রাখুন!` : '';
        return {
            title: '🧠 আজকের Brain Battle শুরু করুন!',
            body: `ইসলামিক জ্ঞান পরীক্ষায় অংশ নিন এবং পয়েন্ট অর্জন করুন।${streakText}`,
        };
    }
    if (lang === 'ar') {
        return {
            title: '🧠 ابدأ مسابقة اليوم!',
            body: 'اختبر معرفتك الإسلامية واكسب نقاطاً في المسابقة اليومية.',
        };
    }
    const streakText = streak > 1 ? ` 🔥 Keep your ${streak}-day streak alive!` : '';
    return {
        title: '🧠 Today\'s Brain Battle is ready!',
        body: `Test your Islamic knowledge and earn points.${streakText}`,
    };
}

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';

    // Fetch users who have push subscriptions and (optionally) quizReminder enabled
    // Using `as any` because quizReminder was added to schema after client generation
    const users = await (prisma.user.findMany as any)({
        where: {
            pushSubscriptions: { some: {} },
            notificationPrefs: { quizReminder: true },
        },
        select: {
            id: true,
            timezone: true,
            preferredLanguage: true,
            notificationPrefs: {
                select: { quizReminder: true, quizHour: true, quizMinute: true },
            },
        },
    }) as Array<{
        id: number;
        timezone: string | null;
        preferredLanguage: string | null;
        notificationPrefs: { quizReminder: boolean; quizHour: number; quizMinute: number } | null;
    }>;

    // Get today's completed quiz attempts for dedup
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayAttempts = await prisma.quizAttempt.findMany({
        where: {
            createdAt: { gte: todayStart },
            completedAt: { not: null }, // has been completed today
        },
        select: { userId: true },
    });
    const alreadyPlayedSet = new Set(todayAttempts.map((a: { userId: number }) => a.userId));

    // Get quiz profiles for streak data
    const userIds = users.map(u => u.id);
    const profiles = await prisma.userQuizProfile.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, currentStreak: true },
    });
    const streakMap = new Map(profiles.map(p => [p.userId, p.currentStreak]));

    const notified: { userId: number; sent: boolean; reason?: string }[] = [];

    for (const user of users) {
        const prefs = user.notificationPrefs as { quizReminder: boolean; quizHour: number; quizMinute: number } | null;
        if (!prefs?.quizReminder) continue;

        if (wasSentToday(user.id)) continue;

        // Skip if user already played today
        if (alreadyPlayedSet.has(user.id)) {
            notified.push({ userId: user.id, sent: false, reason: 'already_played' });
            continue;
        }

        // Check if current local time matches their configured time (±15 min)
        const { h, m } = localTime(user.timezone || 'Asia/Dhaka');
        const nowMin = h * 60 + m;
        const targetMin = (prefs.quizHour ?? 8) * 60 + (prefs.quizMinute ?? 0);
        if (Math.abs(nowMin - targetMin) > 15) continue;

        const lang = user.preferredLanguage || 'bn';
        const streak = streakMap.get(user.id) ?? 0;
        const { title, body } = buildMessage(lang, streak);

        if (!dryRun) {
            await sendPushToUser(user.id, title, body, {
                type: 'quiz_reminder',
                url: '/quiz',
            });
            sentCache.set(user.id, Date.now());
        }

        notified.push({ userId: user.id, sent: !dryRun });
    }

    return NextResponse.json({
        success: true,
        dryRun,
        notified: notified.filter(n => n.sent).length,
        skipped: notified.filter(n => !n.sent).length,
        results: notified,
    });
}

// Also allow GET (for cron triggers)
export { POST as GET };
