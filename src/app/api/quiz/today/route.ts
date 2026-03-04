import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { getOrCreateQuizProfile, checkAndResetSeason, pickDailyQuestions } from '@/lib/services/quizService';
import { isFriday, getCurrentHijriMonth } from '@/lib/hijriUtils';

/**
 * GET /api/quiz/today
 * Returns today's quiz session for the logged-in user.
 * CRITICAL: correctIndex and explanations are STRIPPED from the response to prevent cheating.
 *
 * QUIZ SCHEDULING:
 * This route respects the SystemSettings quiz schedule configuration.
 * Returns WAITING if before the quiz window, CLOSED if after, or the quiz data if within window.
 */

// ─── Quiz Schedule Helpers ─────────────────────────────────────

type SystemSettings = {
    quizFrequency: string;
    quizStartTime: string;
    quizEndTime: string;
    quizWeeklyDay: number;
    quizMonthlyDay: number;
    quizCustomDate: Date | null;
};

type WindowStatus =
    | { state: 'OPEN' }
    | { state: 'WAITING'; scheduledAt: Date | undefined }
    | { state: 'CLOSED' };

/**
 * Returns one of:
 * - OPEN: quiz is accessible right now
 * - WAITING: quiz hasn't started yet today (shows countdown to open time)
 * - CLOSED: quiz window has passed for today
 */
function getQuizWindowStatus(settings: SystemSettings): WindowStatus {
    const now = new Date();
    const freq = settings.quizFrequency || 'daily';

    // Parse HH:MM times
    const [startHH, startMM] = (settings.quizStartTime || '15:00').split(':').map(Number);
    const [endHH, endMM] = (settings.quizEndTime || '18:00').split(':').map(Number);

    // Build open/close times for today
    const todayOpen = new Date(now);
    todayOpen.setHours(startHH, startMM, 0, 0);
    const todayClose = new Date(now);
    todayClose.setHours(endHH, endMM, 0, 0);

    if (freq === 'custom') {
        if (!settings.quizCustomDate) return { state: 'WAITING', scheduledAt: undefined };
        const customDate = new Date(settings.quizCustomDate);
        if (now >= customDate) return { state: 'OPEN' };
        return { state: 'WAITING', scheduledAt: customDate };
    }

    if (freq === 'weekly') {
        const targetDay = settings.quizWeeklyDay ?? 5;
        const dayOfWeek = now.getDay();
        if (dayOfWeek !== targetDay) {
            const daysUntil = (targetDay - dayOfWeek + 7) % 7 || 7;
            const nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + daysUntil);
            nextDate.setHours(startHH, startMM, 0, 0);
            return { state: 'WAITING', scheduledAt: nextDate };
        }
        if (now < todayOpen) return { state: 'WAITING', scheduledAt: todayOpen };
        if (now > todayClose) return { state: 'CLOSED' };
        return { state: 'OPEN' };
    }

    if (freq === 'monthly') {
        const targetDay = settings.quizMonthlyDay ?? 1;
        const dayOfMonth = now.getDate();
        if (dayOfMonth !== targetDay) {
            const nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay, startHH, startMM, 0, 0);
            if (nextDate <= now) nextDate.setMonth(nextDate.getMonth() + 1);
            return { state: 'WAITING', scheduledAt: nextDate };
        }
        if (now < todayOpen) return { state: 'WAITING', scheduledAt: todayOpen };
        if (now > todayClose) return { state: 'CLOSED' };
        return { state: 'OPEN' };
    }

    // Default: daily
    if (now < todayOpen) return { state: 'WAITING', scheduledAt: todayOpen };
    if (now > todayClose) return { state: 'CLOSED' };
    return { state: 'OPEN' };
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        // Fetch quiz schedule settings via raw query (Prisma client may be stale)
        const rows = await prisma.$queryRaw<any[]>`SELECT * FROM system_settings LIMIT 1`;
        const rawSettings = rows[0];
        const scheduleSettings: SystemSettings = {
            quizFrequency: rawSettings?.quiz_frequency ?? 'daily',
            quizStartTime: rawSettings?.quiz_start_time ?? '15:00',
            quizEndTime: rawSettings?.quiz_end_time ?? '18:00',
            quizWeeklyDay: rawSettings?.quiz_weekly_day ?? 5,
            quizMonthlyDay: rawSettings?.quiz_monthly_day ?? 1,
            quizCustomDate: rawSettings?.quiz_custom_date ?? null,
        };

        // Check if quiz window is currently open
        const windowStatus = getQuizWindowStatus(scheduleSettings);

        if (windowStatus.state === 'WAITING') {
            return NextResponse.json({
                status: 'WAITING',
                scheduledAt: windowStatus.scheduledAt?.toISOString() ?? null,
            });
        }

        if (windowStatus.state === 'CLOSED') {
            // Calculate when the next quiz opens
            const [startHH, startMM] = (scheduleSettings.quizStartTime || '15:00').split(':').map(Number);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(startHH, startMM, 0, 0);
            return NextResponse.json({
                status: 'CLOSED',
                nextOpenAt: tomorrow.toISOString(),
            });
        }

        // ALWAYS format local date to UTC midnight for Prisma @db.Date to work flawlessly.
        const nowLocal = new Date();
        const year = nowLocal.getFullYear();
        const month = String(nowLocal.getMonth() + 1).padStart(2, '0');
        const day = String(nowLocal.getDate()).padStart(2, '0');
        const todayUTC = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

        // Get existing attempt with exact UTC date match
        const existingAttempt = await prisma.quizAttempt.findFirst({
            where: {
                userId,
                date: todayUTC,
            },
            include: { answers: { select: { questionId: true } } },
            orderBy: { createdAt: 'desc' },
        });

        // Get quiz profile (streak, lifelines, etc.)
        let profile = await getOrCreateQuizProfile(userId);
        profile = await checkAndResetSeason(profile);

        const safeProfile = {
            currentStreak: profile.currentStreak,
            maxStreak: profile.maxStreak,
            seasonQuizPoints: profile.seasonQuizPoints,
            totalQuizPoints: profile.totalQuizPoints,
            lifelines5050: profile.lifelines5050,
            streakSavers: profile.streakSavers,
            currentHijriMonth: profile.currentHijriMonth,
        };

        // If attempt exists and is completed
        if (existingAttempt?.completedAt) {
            return NextResponse.json({
                status: 'COMPLETED',
                attempt: {
                    id: existingAttempt.id,
                    totalScore: existingAttempt.totalScore,
                    finalScore: existingAttempt.finalScore,
                    streakMultiplier: Number(existingAttempt.streakMultiplier),
                    correctCount: existingAttempt.correctCount,
                    questionsCount: existingAttempt.questionsCount,
                    isBossDay: existingAttempt.isBossDay,
                },
                profile: safeProfile,
            });
        }

        // If attempt exists but not completed (resume)
        if (existingAttempt && !existingAttempt.completedAt) {
            const answeredQuestionIds = existingAttempt.answers.map(a => a.questionId);
            return NextResponse.json({
                status: 'IN_PROGRESS',
                attempt: { id: existingAttempt.id, questionsCount: existingAttempt.questionsCount, isBossDay: existingAttempt.isBossDay },
                answeredQuestionIds,
                profile: safeProfile,
            });
        }

        // Create a new attempt
        const bossDay = isFriday();
        const questions = await pickDailyQuestions(bossDay, todayUTC);

        let newAttempt;
        try {
            newAttempt = await prisma.quizAttempt.create({
                data: {
                    userId,
                    date: todayUTC,
                    hijriMonth: getCurrentHijriMonth(),
                    questionsCount: questions.length,
                    isBossDay: bossDay,
                },
            });
        } catch (createError: any) {
            // P2002 = unique constraint − attempt was created by a concurrent request
            if (createError?.code === 'P2002') {
                const race = await prisma.quizAttempt.findFirst({
                    where: { userId, date: todayUTC },
                    include: { answers: { select: { questionId: true } } },
                    orderBy: { createdAt: 'desc' },
                });
                if (race?.completedAt) {
                    return NextResponse.json({
                        status: 'COMPLETED',
                        attempt: {
                            id: race.id,
                            totalScore: race.totalScore,
                            finalScore: race.finalScore,
                            streakMultiplier: Number(race.streakMultiplier),
                            correctCount: race.correctCount,
                            questionsCount: race.questionsCount,
                            isBossDay: race.isBossDay,
                        },
                        profile: safeProfile,
                    });
                }
                if (race) {
                    return NextResponse.json({
                        status: 'IN_PROGRESS',
                        attempt: { id: race.id, questionsCount: race.questionsCount, isBossDay: race.isBossDay },
                        answeredQuestionIds: race.answers.map(a => a.questionId),
                        profile: safeProfile,
                    });
                }
            }
            throw createError;
        }

        // Strip sensitive data before sending to client
        const safeQuestions = questions.map(q => ({
            id: q.id,
            questionBn: q.questionBn,
            questionEn: q.questionEn,
            questionAr: q.questionAr,
            optionsBn: q.optionsBn,
            optionsEn: q.optionsEn,
            optionsAr: q.optionsAr,
            category: q.category,
            difficulty: q.difficulty,
            // NO correctIndex, NO explanations
        }));

        return NextResponse.json({
            status: 'READY',
            attempt: { id: newAttempt.id, questionsCount: newAttempt.questionsCount, isBossDay: newAttempt.isBossDay },
            questions: safeQuestions,
            profile: safeProfile,
        });
    } catch (error) {
        console.error('[GET /api/quiz/today]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
