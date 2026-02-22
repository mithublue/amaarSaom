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
import { sendPushToUser } from '@/lib/firebase/firebaseAdmin';
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

    // Fetch global system settings
    const sysSettings = await prisma.systemSettings.findFirst();
    const globalPrayerEnabled = sysSettings?.globalPrayerNotifications !== false;
    const globalLeaderboardEnabled = sysSettings?.globalLeaderboardNotifications !== false;

    const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';
    const stats = { prayerSent: 0, leaderboardSent: 0, prayerSkipped: 0, leaderboardSkipped: 0 };

    // ── Load all subscribed users + their prefs ──
    const users = await prisma.user.findMany({
        where: { pushSubscriptions: { some: {} } },
        select: {
            id: true,
            name: true,
            cityName: true,
            countryName: true,
            timezone: true,
            preferredLanguage: true,
            notificationPrefs: true,
        },
    });

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

    // ── Fetch weekly leaderboard once ──
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyBoard = await prisma.leaderboardCache.findMany({
        where: { period: 'week', date: { gte: weekStart }, rank: { not: null } },
        orderBy: { rank: 'asc' },
        select: { userId: true, totalPoints: true, rank: true },
    });
    // Index: userId → { rank, points }
    const boardIndex = new Map<number, { rank: number; points: number }>();
    for (const r of weeklyBoard) {
        if (r.rank !== null) {
            boardIndex.set(r.userId, { rank: r.rank, points: r.totalPoints });
        }
    }

    // ── Prayer time cache: city+country → times (avoid re-fetching same city) ──
    const prayerCache = new Map<string, Record<PrayerName, string> | null>();

    for (const user of users) {
        const lang = user.preferredLanguage || 'en';
        const tz = user.timezone || 'Asia/Dhaka';
        const prefs = user.notificationPrefs;

        // ── CONDITION 1: Prayer Reminder ──
        if (globalPrayerEnabled) {
            const anyPrayerEnabled = !prefs || Object.values({
                Fajr: prefs.fajrReminder,
                Dhuhr: prefs.dhuhrReminder,
                Asr: prefs.asrReminder,
                Maghrib: prefs.maghribReminder,
                Isha: prefs.ishaReminder,
            }).some(Boolean);

            if (anyPrayerEnabled) {
                const city = user.cityName || 'Dhaka';
                const country = user.countryName || 'Bangladesh';
                const cacheKey = `${city}|${country}`;

                if (!prayerCache.has(cacheKey)) {
                    prayerCache.set(cacheKey, await fetchPrayerTimes(city, country));
                }
                const times = prayerCache.get(cacheKey);

                if (times) {
                    const prayer = getPrayerToRemind(times, tz);
                    if (prayer) {
                        const prefKey = PRAYER_PREF_KEY[prayer];
                        const enabled = !prefs || (prefs as any)[prefKey] !== false;

                        if (enabled && !prayerWasSent(user.id, prayer)) {
                            const { title, body } = getPrayerNotificationText(prayer, lang);
                            if (!dryRun) {
                                await sendPushToUser(user.id, title, body, { type: 'prayer_reminder', prayer });
                                markPrayerSent(user.id, prayer);
                            }
                            stats.prayerSent++;
                        }
                    }
                }
            }
        } else {
            stats.prayerSkipped++;
        }

        // ── CONDITION 2: Leaderboard Motivation ──
        if (globalLeaderboardEnabled) {
            const leaderboardEnabled = !prefs || prefs.leaderboardMotivation;
            if (leaderboardEnabled && !leaderboardWasSent(user.id)) {
                const { h, m } = localTime(tz);
                const nowMin = h * 60 + m;
                const prefH = prefs?.leaderboardHour ?? 20;
                const prefM = prefs?.leaderboardMinute ?? 0;
                const targetMin = prefH * 60 + prefM;

                if (Math.abs(nowMin - targetMin) <= 7) {
                    const myEntry = boardIndex.get(user.id);
                    if (myEntry && myEntry.rank > 1) {
                        const above = weeklyBoard.find((r: any) => r.rank === myEntry.rank - 1 || r.rank === myEntry.rank - 2);
                        if (above) {
                            const pointDiff = above.totalPoints - myEntry.points;
                            if (pointDiff > 0) {
                                const competitor = users.find((u: any) => u.id === above.userId);
                                const competitorName = competitor?.name || 'A fellow user';
                                const deed = randomDeed(lang);
                                const { title, body } = buildLeaderboardMsg(competitorName, pointDiff, deed, lang);

                                if (!dryRun) {
                                    await sendPushToUser(user.id, title, body, { type: 'leaderboard_motivation' });
                                    leaderboardSentCache.set(user.id, Date.now());
                                }
                                stats.leaderboardSent++;
                            }
                        }
                    }
                }
            }
        } else {
            stats.leaderboardSkipped++;
        }
    }

    // ── CONDITION 3: Custom Admin Notifications ──
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

        // Mark as sent
        await prisma.customNotification.update({
            where: { id: notif.id },
            data: { isSent: true }
        });
    }

    return NextResponse.json({ success: true, dryRun, ...stats, customNotifsSent: pendingNotifs.length });
}

// Allow GET as well for easy browser testing
export { POST as GET };
