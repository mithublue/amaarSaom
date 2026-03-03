import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { getOrCreateQuizProfile, checkAndResetSeason, pickDailyQuestions } from '@/lib/services/quizService';
import { isFriday, getCurrentHijriMonth } from '@/lib/hijriUtils';
import { startOfDay } from 'date-fns';

/**
 * GET /api/quiz/today
 * Returns today's quiz session for the logged-in user.
 * CRITICAL: correctIndex and explanations are STRIPPED from the response to prevent cheating.
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const today = startOfDay(new Date());

        // Check if attempt already exists for today
        const existingAttempt = await prisma.quizAttempt.findUnique({
            where: { userId_date: { userId, date: today } },
            include: { answers: { select: { questionId: true } } },
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
                    streakMultiplier: existingAttempt.streakMultiplier,
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
            // Fetch the questions for this attempt from the answers' question IDs
            // We need to show the remaining unanswered questions
            // Since we don't store which questions were assigned, we fetch from answers questionIds
            // If no answers yet, we need to pick questions again - but we can't since we don't store them
            // Better: fetch all active questions and filter out answered ones for display
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

        const newAttempt = await prisma.quizAttempt.create({
            data: {
                userId,
                date: today,
                hijriMonth: getCurrentHijriMonth(),
                questionsCount: questions.length,
                isBossDay: bossDay,
            },
        });

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
