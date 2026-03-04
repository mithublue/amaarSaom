/**
 * Quiz Service
 * Handles all business logic for the Daily Islamic Quiz feature.
 * This system is FULLY DECOUPLED from the Good Deeds system.
 * Quiz points do NOT affect User.lifetimePoints or LeaderboardCache.
 */

import { prisma } from '../db/prisma';
import { startOfDay } from 'date-fns';
import { getCurrentHijriMonth, isFriday } from '../hijriUtils';

// ─── Types ───────────────────────────────────────────

export interface QuizQuestion {
    id: number;
    questionBn: string;
    questionEn: string;
    questionAr?: string | null;
    optionsBn: string[];
    optionsEn: string[];
    optionsAr?: string[] | null;
    category: string;
    difficulty: string;
    // NOTE: correctIndex and explanations are NEVER included in client-facing question payloads
}

export interface QuizQuestionWithAnswer extends QuizQuestion {
    correctIndex: number;
    explanationBn?: string | null;
    explanationEn?: string | null;
    explanationAr?: string | null;
}

export interface AnswerPointsResult {
    pointsAwarded: number;
    isCorrect: boolean;
    correctIndex: number;
    explanationBn: string | null;
    explanationEn: string | null;
    explanationAr: string | null;
}

// ─── Point Calculation ────────────────────────────────

/**
 * Calculate points for a single answer based on time taken.
 * Anti-cheat: if used5050 is true, points are halved.
 */
export function calculateAnswerPoints(timeTakenMs: number, isCorrect: boolean, used5050: boolean): number {
    if (!isCorrect || timeTakenMs < 0) return 0;

    let pts = 0;
    if (timeTakenMs <= 3000) pts = 100;
    else if (timeTakenMs <= 5000) pts = 80;
    else if (timeTakenMs <= 10000) pts = 50;
    else if (timeTakenMs <= 15000) pts = 30;
    else pts = 0; // Timeout

    if (used5050) pts = Math.floor(pts * 0.5);
    return pts;
}

/**
 * Calculate streak multiplier based on consecutive days played.
 */
export function calculateStreakMultiplier(streak: number): number {
    if (streak >= 21) return 3.0;
    if (streak >= 14) return 2.5;
    if (streak >= 7) return 2.0;
    if (streak >= 3) return 1.5;
    return 1.0;
}

// ─── Question Management ──────────────────────────────

/**
 * Pick daily questions deterministically.
 * Every user playing on the same UTC date will receive the exact same questions.
 * Questions are fetched sequentially from a statically shuffled deck to ensure no repetition 
 * until the entire question bank is exhausted.
 */
export async function pickDailyQuestions(isBossDay: boolean, dateUTC: Date): Promise<QuizQuestion[]> {
    // Number of days since epoch (Jan 1, 1970)
    const daysSinceEpoch = Math.floor(dateUTC.getTime() / 86400000);
    const STATIC_SEED = 1337; // Fixed seed to randomize the base pool order

    if (isBossDay) {
        const bossQuestions = await prisma.quizQuestion.findMany({
            where: { difficulty: 'boss', isActive: true },
            orderBy: { id: 'asc' },
            select: { id: true, questionBn: true, questionEn: true, questionAr: true, optionsBn: true, optionsEn: true, optionsAr: true, category: true, difficulty: true },
        });
        const regularQuestions = await prisma.quizQuestion.findMany({
            where: { difficulty: { not: 'boss' }, isActive: true },
            orderBy: { id: 'asc' },
            select: { id: true, questionBn: true, questionEn: true, questionAr: true, optionsBn: true, optionsEn: true, optionsAr: true, category: true, difficulty: true },
        });

        const shuffledBoss = deterministicShuffle(bossQuestions as unknown as QuizQuestion[], STATIC_SEED);
        const shuffledRegular = deterministicShuffle(regularQuestions as unknown as QuizQuestion[], STATIC_SEED);

        const bossCount = 2;
        const bossStart = (daysSinceEpoch * bossCount) % Math.max(1, shuffledBoss.length);
        const pickedBoss = sliceWrap(shuffledBoss, bossStart, bossCount);

        const regCount = 3;
        const regStart = (daysSinceEpoch * regCount) % Math.max(1, shuffledRegular.length);
        const pickedReg = sliceWrap(shuffledRegular, regStart, regCount);

        return deterministicShuffle([...pickedBoss, ...pickedReg], daysSinceEpoch);
    } else {
        const count = 3;
        const regularQuestions = await prisma.quizQuestion.findMany({
            where: { difficulty: { not: 'boss' }, isActive: true },
            orderBy: { id: 'asc' },
            select: { id: true, questionBn: true, questionEn: true, questionAr: true, optionsBn: true, optionsEn: true, optionsAr: true, category: true, difficulty: true },
        });

        const shuffledRegular = deterministicShuffle(regularQuestions as unknown as QuizQuestion[], STATIC_SEED);

        const regStart = (daysSinceEpoch * count) % Math.max(1, shuffledRegular.length);
        const pickedReg = sliceWrap(shuffledRegular, regStart, count);

        return deterministicShuffle(pickedReg, daysSinceEpoch);
    }
}

// Helper to slice with wrap-around
function sliceWrap<T>(arr: T[], start: number, count: number): T[] {
    const res: T[] = [];
    if (arr.length === 0) return res;
    for (let i = 0; i < count; i++) {
        res.push(arr[(start + i) % arr.length]);
    }
    return res;
}

// PRNG for deterministic shuffling (Mulberry32)
function deterministicShuffle<T>(arr: T[], seed: number): T[] {
    // Local copy of seed to avoid mutating the outer scope
    let _seed = seed;
    const prng = () => {
        let t = _seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Profile Management ───────────────────────────────

/**
 * Get or create a UserQuizProfile for the given user.
 */
export async function getOrCreateQuizProfile(userId: number) {
    const existing = await prisma.userQuizProfile.findUnique({ where: { userId } });
    if (existing) return existing;

    return prisma.userQuizProfile.create({
        data: {
            userId,
            currentHijriMonth: getCurrentHijriMonth(),
            lifelines5050: 1, // Every user starts with 1 free 50/50
        },
    });
}

/**
 * Check if the user's season has changed (new Hijri month) and reset if needed.
 * If season changes, award a QuizTrophy for the old season (if they earned points).
 */
export async function checkAndResetSeason(profile: Awaited<ReturnType<typeof getOrCreateQuizProfile>>) {
    const currentMonth = getCurrentHijriMonth();
    if (profile.currentHijriMonth === currentMonth) return profile; // Same season, no reset needed

    // Award trophy for last season if user had points
    if (profile.seasonQuizPoints > 0) {
        // Calculate rank for this user in the last season
        const rank = await getSeasonRank(profile.userId, profile.currentHijriMonth || currentMonth);
        await prisma.quizTrophy.create({
            data: {
                userId: profile.userId,
                hijriMonth: profile.currentHijriMonth || currentMonth,
                seasonPoints: profile.seasonQuizPoints,
                rank,
            },
        });
    }

    // Reset season points
    return prisma.userQuizProfile.update({
        where: { userId: profile.userId },
        data: {
            seasonQuizPoints: 0,
            currentHijriMonth: currentMonth,
        },
    });
}

async function getSeasonRank(userId: number, hijriMonth: string): Promise<number> {
    try {
        const entry = await prisma.quizLeaderboardCache.findFirst({
            where: { userId, hijriMonth, period: 'season', scopeType: 'global' },
        });
        return entry?.rank || 999;
    } catch {
        return 999;
    }
}

// ─── Answer Submission ────────────────────────────────

/**
 * Process a single answer submission.
 * Fetches the question, calculates points, and saves the QuizAnswer.
 */
export async function processAnswer(params: {
    attemptId: number;
    userId: number;
    questionId: number;
    selectedIndex: number;
    timeTakenMs: number;
    used5050: boolean;
}): Promise<AnswerPointsResult> {
    const { attemptId, userId, questionId, selectedIndex, timeTakenMs, used5050 } = params;

    // Verify attempt belongs to user and is not completed
    const attempt = await prisma.quizAttempt.findFirst({
        where: { id: attemptId, userId, completedAt: null },
    });
    if (!attempt) throw new Error('Invalid or already completed attempt');

    // Verify question hasn't been answered in this attempt
    const existingAnswer = await prisma.quizAnswer.findFirst({
        where: { attemptId, questionId },
    });
    if (existingAnswer) throw new Error('Question already answered');

    // Get the full question (with correctIndex)
    const question = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new Error('Question not found');

    const isCorrect = selectedIndex === question.correctIndex;
    const pointsAwarded = calculateAnswerPoints(timeTakenMs, isCorrect, used5050);

    // Save the answer
    await prisma.quizAnswer.create({
        data: {
            attemptId,
            questionId,
            selectedIndex,
            isCorrect,
            timeTakenMs,
            pointsAwarded,
            used5050,
        },
    });

    // Decrement lifeline if used
    if (used5050) {
        await prisma.userQuizProfile.update({
            where: { userId },
            data: { lifelines5050: { decrement: 1 } },
        });
    }

    return {
        pointsAwarded,
        isCorrect,
        correctIndex: question.correctIndex,
        explanationBn: question.explanationBn,
        explanationEn: question.explanationEn,
        explanationAr: question.explanationAr,
    };
}

// ─── Finalization ─────────────────────────────────────

/**
 * Finalize a quiz attempt: apply streak multiplier, update profile, update leaderboard cache.
 * IMPORTANT: Does NOT touch User.lifetimePoints or the main LeaderboardCache.
 */
export async function finalizeQuizAttempt(attemptId: number, userId: number) {
    // Verify attempt belongs to user
    const attempt = await prisma.quizAttempt.findFirst({
        where: { id: attemptId, userId, completedAt: null },
        include: { answers: true },
    });
    if (!attempt) throw new Error('Invalid or already completed attempt');

    // Sum up raw score
    const totalScore = attempt.answers.reduce((sum, a) => sum + a.pointsAwarded, 0);
    const correctCount = attempt.answers.filter(a => a.isCorrect).length;

    // Get/update quiz profile
    let profile = await getOrCreateQuizProfile(userId);
    profile = await checkAndResetSeason(profile); // Reset season if Hijri month changed

    // Streak calculation: normalize today's local date to UTC midnight to match @db.Date storage
    const nowLocal = new Date();
    const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}T00:00:00.000Z`;
    const today = new Date(todayStr);

    const lastPlayed = profile.lastPlayedDate ? new Date(profile.lastPlayedDate) : null;
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    let newStreak = 1;
    if (lastPlayed) {
        if (lastPlayed.getTime() === yesterday.getTime()) {
            newStreak = profile.currentStreak + 1; // Consecutive day
        } else if (lastPlayed.getTime() === today.getTime()) {
            newStreak = profile.currentStreak; // Already played today (shouldn't happen but safety)
        } else {
            // Gap: check for streak saver
            if (profile.streakSavers > 0) {
                newStreak = profile.currentStreak; // Streak saved!
                await prisma.userQuizProfile.update({
                    where: { userId },
                    data: { streakSavers: { decrement: 1 } },
                });
            } else {
                newStreak = 1; // Reset streak
            }
        }
    }

    const streakMultiplier = calculateStreakMultiplier(newStreak);
    const finalScore = Math.floor(totalScore * streakMultiplier);
    const currentHijriMonth = getCurrentHijriMonth();

    // Update the attempt with final values
    await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
            totalScore,
            finalScore,
            streakMultiplier,
            correctCount,
            hijriMonth: currentHijriMonth,
            completedAt: new Date(),
        },
    });

    // Update quiz profile (quiz-only points, NOT lifetimePoints)
    const updatedProfile = await prisma.userQuizProfile.update({
        where: { userId },
        data: {
            totalQuizPoints: { increment: finalScore },
            seasonQuizPoints: { increment: finalScore },
            currentStreak: newStreak,
            maxStreak: Math.max(profile.maxStreak, newStreak),
            lastPlayedDate: today,
            currentHijriMonth,
        },
    });

    // Update the dedicated quiz leaderboard cache (async, don't block response)
    updateQuizLeaderboardCache(userId, currentHijriMonth).catch(console.error);

    return {
        finalScore,
        totalScore,
        streakMultiplier,
        correctCount,
        questionsCount: attempt.questionsCount,
        currentStreak: newStreak,
        maxStreak: updatedProfile.maxStreak,
        seasonQuizPoints: updatedProfile.seasonQuizPoints,
        totalQuizPoints: updatedProfile.totalQuizPoints,
    };
}

// ─── Leaderboard Cache ────────────────────────────────

/**
 * Update the QUIZ leaderboard cache for a user.
 * Completely separate from the main deeds LeaderboardCache.
 */
export async function updateQuizLeaderboardCache(userId: number, hijriMonth: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, districtId: true, divisionId: true, countryId: true },
    });
    if (!user) return;

    // Calculate season and overall points
    const seasonAgg = await prisma.quizAttempt.aggregate({
        where: { userId, hijriMonth, completedAt: { not: null } },
        _sum: { finalScore: true },
    });
    const overallAgg = await prisma.quizAttempt.aggregate({
        where: { userId, completedAt: { not: null } },
        _sum: { finalScore: true },
    });

    const seasonPoints = seasonAgg._sum.finalScore || 0;
    const overallPoints = overallAgg._sum.finalScore || 0;

    const scopes = [
        { type: 'global', id: null },
        { type: 'country', id: user.countryId },
        { type: 'division', id: user.divisionId },
        { type: 'district', id: user.districtId },
    ];

    for (const scope of scopes) {
        // Season leaderboard
        await prisma.quizLeaderboardCache.upsert({
            where: {
                userId_period_hijriMonth_scopeType_scopeId: {
                    userId,
                    period: 'season',
                    hijriMonth,
                    scopeType: scope.type,
                    scopeId: scope.id || 0,
                },
            },
            update: { totalPoints: seasonPoints },
            create: {
                userId,
                period: 'season',
                hijriMonth,
                scopeType: scope.type,
                scopeId: scope.id || 0,
                totalPoints: seasonPoints,
            },
        });

        // Overall leaderboard (hijriMonth is null for overall period)
        const existingOverall = await prisma.quizLeaderboardCache.findFirst({
            where: {
                userId,
                period: 'overall',
                hijriMonth: null,
                scopeType: scope.type,
                scopeId: scope.id || 0,
            },
        });
        if (existingOverall) {
            await prisma.quizLeaderboardCache.update({
                where: { id: existingOverall.id },
                data: { totalPoints: overallPoints },
            });
        } else {
            await prisma.quizLeaderboardCache.create({
                data: {
                    userId,
                    period: 'overall',
                    hijriMonth: null,
                    scopeType: scope.type,
                    scopeId: scope.id || 0,
                    totalPoints: overallPoints,
                },
            });
        }
    }
}
