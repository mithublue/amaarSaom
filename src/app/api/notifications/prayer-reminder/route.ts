/**
 * POST /api/notifications/prayer-reminder
 * Vercel Cron: every 5 minutes
 * For each user: fetches prayer times, checks if a prayer was 15-20 minutes ago,
 * and sends a push notification if the user has prayer reminders enabled.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendPushToUser } from '@/lib/firebase/firebaseAdmin';
import {
    fetchPrayerTimes,
    getPrayerToRemind,
    getPrayerNotificationText,
    PrayerName,
} from '@/lib/notifications/prayerScheduler';

// In-memory dedup: track (userId, prayer) sent in the last 30 min
// In production use Redis; this is good enough for single-instance deployments
const sentCache = new Map<string, number>();
const DEDUP_TTL_MS = 30 * 60 * 1000; // 30 minutes

function wasSentRecently(userId: number, prayer: PrayerName): boolean {
    const key = `${userId}-${prayer}`;
    const last = sentCache.get(key);
    if (!last) return false;
    if (Date.now() - last > DEDUP_TTL_MS) {
        sentCache.delete(key);
        return false;
    }
    return true;
}

function markSent(userId: number, prayer: PrayerName) {
    sentCache.set(`${userId}-${prayer}`, Date.now());
}

export async function POST(req: NextRequest) {
    // Validate cron secret to prevent unauthorized calls
    const secret = req.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';

    // Get all users with push subscriptions and prayer reminders enabled
    const users = await (prisma as any).user.findMany({
        where: {
            pushSubscriptions: { some: {} }, // has at least 1 FCM token
            OR: [
                { notificationPrefs: { prayerReminder: true } },
                { notificationPrefs: null }, // treat no-prefs as default (enabled)
            ],
        },
        select: {
            id: true,
            cityName: true,
            countryName: true,
            timezone: true,
            preferredLanguage: true,
            notificationPrefs: { select: { prayerReminder: true } },
        },
    });

    const results: { userId: number; prayer: string; sent: boolean }[] = [];

    for (const user of (users as any[])) {
        // Skip if prayer reminders explicitly disabled
        if (user.notificationPrefs && !user.notificationPrefs.prayerReminder) continue;

        const city = user.cityName || 'Dhaka';
        const country = user.countryName || 'Bangladesh';
        const tz = user.timezone || 'Asia/Dhaka';
        const lang = user.preferredLanguage || 'en';

        const times = await fetchPrayerTimes(city, country);
        if (!times) continue;

        const prayer = getPrayerToRemind(times, tz);
        if (!prayer) continue;

        if (wasSentRecently(user.id, prayer)) continue;

        const { title, body } = getPrayerNotificationText(prayer, lang);

        if (!dryRun) {
            await sendPushToUser(user.id, title, body, { type: 'prayer_reminder', prayer });
            markSent(user.id, prayer);
        }

        results.push({ userId: user.id, prayer, sent: !dryRun });
    }

    return NextResponse.json({ success: true, dryRun, notified: results.length, results });
}

// Allow Vercel Cron (GET) as well
export { POST as GET };
