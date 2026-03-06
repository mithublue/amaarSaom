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
const quizSentCache = new Map<number, number>(); // key: userId  (dedup for quiz reminder)
const PRAYER_DEDUP_MS = 30 * 60 * 1000;    // 30 min — prevents double-sends
const LEADERBOARD_DEDUP_MS = 23 * 60 * 60 * 1000; // 23 hrs — once per day
const QUIZ_DEDUP_MS = 23 * 60 * 60 * 1000; // 23 hrs — once per day

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
function quizWasSent(userId: number, dedupMs: number = QUIZ_DEDUP_MS): boolean {
    const t = quizSentCache.get(userId);
    if (!t) return false;
    if (Date.now() - t > dedupMs) { quizSentCache.delete(userId); return false; }
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

/** Build FOMO quiz reminder notification (multilingual, randomized) */
function buildQuizMsg(lang: string, frequency: string): { title: string; body: string } {
    const isWeekly = frequency === 'weekly';
    const isMonthly = frequency === 'monthly';

    const bnVariants = isMonthly ? [
        { title: '🏆 মাসের সুযোগ এসেছে!', body: 'এই মাসের বিশেষ কুইজ এখন লাইভ! একবারই সুযোগ — এখনই না খেললে পুরো মাস আফসোস করবেন।' },
        { title: '🏆 এই মাসের চ্যালেঞ্জ LIVE!', body: 'শুধু একবারের সুযোগ। আপনার বন্ধুরা ইতিমধ্যে খেলছে — আপনি কি পিছিয়ে পড়বেন?' },
    ] : isWeekly ? [
        { title: '🏆 এই সপ্তাহের কুইজ শুরু!', body: 'সাপ্তাহিক ব্রেইন-ব্যাটল এখন লাইভ! মাত্র ৩টি প্রশ্ন — শীর্ষে থাকতে এখনই খেলুন। আর সুযোগ নেই এ সপ্তাহে!' },
        { title: '🏆 সপ্তাহের একটাই কুইজ!', body: '৭ দিনের মধ্যে এটাই একমাত্র সুযোগ। টপ র‌্যাংকে যাদের নাম আছে — তারা ইতিমধ্যে খেলে ফেলেছে!' },
    ] : [
        { title: '🏆 আজকের কুইজ এখন লাইভ!', body: 'মাত্র ৩টি প্রশ্ন — ১৫ সেকেন্ড করে। এখনই না খেললে আজকের পয়েন্ট মিস! লিডারবোর্ডে আপনার জায়গা ধরে রাখুন।' },
        { title: '🏆 আজ কুইজ মিস করলেই স্ট্রিক শেষ!', body: 'আপনার স্ট্রিক এখন রিস্কে! ৩টি প্রশ্নে উত্তর দিন, আজকের পয়েন্ট বাগান — এবং লিডারবোর্ডে এগিয়ে যান।' },
        { title: '🏆 আজকের ব্রেইন-ব্যাটল চলছে!', body: 'আপনার প্রতিযোগীরা এখন খেলছে। পিছিয়ে পড়বেন না — ৩টি প্রশ্ন, মাত্র ১ মিনিট।' },
        { title: '🏆 লিডারবোর্ড আপডেট হচ্ছে!', body: 'এই মুহূর্তে অন্যরা পয়েন্ট বাড়াচ্ছে। আপনি কি বসে থাকবেন? আজকের কুইজে যোগ দিন!' },
    ];

    const arVariants = isMonthly ? [
        { title: '🏆 مسابقة الشهر الآن!', body: 'فرصة الشهر الوحيدة لمسابقة قرآنية. أدرك الفرصة قبل فوات الأوان!' },
    ] : isWeekly ? [
        { title: '🏆 مسابقة الأسبوع بدأت!', body: 'مرة واحدة فقط في الأسبوع — الآن أو لا. أجب على ٣ أسئلة وتصدر الترتيب!' },
    ] : [
        { title: '🏆 مسابقة اليوم الآن مباشرة!', body: 'فرصتك اليوم — ٣ أسئلة، ١٥ ثانية لكل منها. لا تفوّت نقاطك اليومية!' },
        { title: '🏆 منافسوك يلعبون الآن!', body: 'حارب بعقلك الآن! القرآن + الذكاء = نقاط. هل ستتأخر وتخسر مرتبتك؟' },
    ];

    const enVariants = isMonthly ? [
        { title: '🏆 Monthly Quiz is LIVE!', body: "One chance this month. Your streak, your rank, your legacy — don't blow it. Play NOW!" },
    ] : isWeekly ? [
        { title: '🏆 This Week\'s Quiz is OPEN!', body: "Only ONE quiz this week. Top players are already in — are you going to let them win?" },
        { title: '🏆 Weekly Brain Battle is LIVE!', body: "3 questions. 45 seconds. One shot at the leaderboard this week. Don't miss it!" },
    ] : [
        { title: '🏆 Quiz is LIVE — Don\'t miss today!', body: "Your daily brain battle is open! 3 Qs, earn points, protect your streak. Others are scoring RIGHT NOW." },
        { title: '🏆 Streak at risk! Quiz is now open.', body: "Don't break your winning streak. Jump in, answer 3 questions in under a minute & stay on top!" },
        { title: '🏆 Others are scoring — you\'re not!', body: "The daily Islamic quiz is LIVE. Every second you wait, someone else moves ahead of you on the leaderboard." },
        { title: '🏆 Leaderboard shifting NOW!', body: "Points are being earned as you read this. Answer today's quiz before the window closes!" },
    ];

    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    if (lang === 'bn') return pick(bnVariants);
    if (lang === 'ar') return pick(arVariants);
    return pick(enVariants);
}

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
        const quizStartTime = sysSettings?.quizStartTime ?? '15:00';
        const quizFrequency = sysSettings?.quizFrequency ?? 'daily'; // 'daily' | 'weekly' | 'monthly'
        const [quizStartH, quizStartM] = quizStartTime.split(':').map(Number);
        const quizStartMin = quizStartH * 60 + quizStartM;
        const QUIZ_WINDOW_MIN = 7; // ±7 minutes match window
        // Dedup window: send once per frequency period
        const QUIZ_DEDUP_MS_EFFECTIVE =
            quizFrequency === 'monthly' ? 29 * 24 * 60 * 60 * 1000 :
                quizFrequency === 'weekly' ? 6 * 24 * 60 * 60 * 1000 :
                    QUIZ_DEDUP_MS; // daily = 23hr

        const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';
        const isTest = req.nextUrl.searchParams.get('test') === 'true';
        const stats = { prayerCount: 0, leaderboardCount: 0, quizCount: 0, prayerSent: 0, leaderboardSent: 0, quizSent: 0 };
        const debugLogs: string[] = [];

        // Prefetch today's quiz attempt user IDs to avoid per-user DB calls
        const todayUtc = new Date();
        todayUtc.setUTCHours(0, 0, 0, 0);
        const quizAttemptedUserIds = new Set<number>(
            (await prisma.quizAttempt.findMany({
                where: { date: { gte: todayUtc } },
                select: { userId: true },
            })).map(a => a.userId)
        );

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

            // ── 3. Quiz Reminder ──────────────────────────────────
            const quizReminderEnabled = !prefs || prefs.quizReminder !== false;
            if (quizReminderEnabled && (isTest || !quizWasSent(user.id, QUIZ_DEDUP_MS_EFFECTIVE))) {
                const { h, m } = localTime(tz);
                const nowMin = h * 60 + m;
                const inWindow = Math.abs(nowMin - quizStartMin) <= QUIZ_WINDOW_MIN;
                const notYetPlayed = !quizAttemptedUserIds.has(user.id);

                if ((isTest || inWindow) && notYetPlayed) {
                    const { title, body } = buildQuizMsg(lang, quizFrequency);
                    if (!dryRun) {
                        await sendPushToUser(user.id, title, body, { type: 'quiz_reminder', url: '/quiz' });
                        if (!isTest) quizSentCache.set(user.id, Date.now());
                    }
                    stats.quizSent++;
                    debugLogs.push(`Sent quiz reminder to user ${user.email} (localTime=${h}:${String(m).padStart(2, '0')})`);
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
