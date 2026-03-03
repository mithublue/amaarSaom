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
 * DATE HANDLING:
 * We use a strictly formatted UTC midnight string matched to the SERVER'S LOCAL date.
 * This perfectly maps to MySQL @db.Date which truncates time and stores UTC midnight.
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

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
        const questions = await pickDailyQuestions(bossDay);

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
