/**
 * Good Deeds Service
 * Handles CRUD operations for user goals and completed deeds
 * Implements gamified point calculation with tiers, bonuses, and multipliers
 */

import { prisma } from '../db/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface PointCalculation {
    basePoints: number;
    bonusPoints: number;
    multiplier: number;
    totalPoints: number;
    isStreakBonus: boolean;
    isPowerDay: boolean;
}

/**
 * Calculate points for a completed deed with bonuses and multipliers
 */
export async function calculatePoints(params: {
    baseDeedPoints: number;
    date: Date;
    userId: number;
    ramadanDayNumber?: number;
}): Promise<PointCalculation> {
    let bonusPoints = 0;
    let multiplier = 1.0;
    const isPowerDay = await checkIfPowerDay(params.date, params.ramadanDayNumber);
    const streakInfo = await checkStreakBonus(params.userId, params.date);

    // Apply Power Day multiplier (2x)
    if (isPowerDay) {
        multiplier = 2.0;
    }

    // Streak bonuses
    if (streakInfo.hasBonus) {
        bonusPoints += streakInfo.bonusPoints;
    }

    // Calculate total points
    const totalPoints = Math.floor((params.baseDeedPoints + bonusPoints) * multiplier);

    return {
        basePoints: params.baseDeedPoints,
        bonusPoints,
        multiplier,
        totalPoints,
        isStreakBonus: streakInfo.hasBonus,
        isPowerDay,
    };
}

/**
 * Check if the date is a Power Day (Friday or last 10 nights of Ramadan)
 */
async function checkIfPowerDay(date: Date, ramadanDayNumber?: number): Promise<boolean> {
    const dayOfWeek = date.getDay();

    // Friday (Jummah)
    if (dayOfWeek === 5) return true;

    // Last 10 nights of Ramadan (21-30)
    if (ramadanDayNumber && ramadanDayNumber >= 21 && ramadanDayNumber <= 30) {
        return true;
    }

    return false;
}

/**
 * Check for prayer streak bonuses
 */
async function checkStreakBonus(userId: number, currentDate: Date): Promise<{ hasBonus: boolean; bonusPoints: number; streakDays: number }> {
    const today = startOfDay(currentDate);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // Get prayer completion for last 7 days
    const completedPrayers = await prisma.completedDeed.groupBy({
        by: ['date'],
        where: {
            userId,
            date: {
                gte: sevenDaysAgo,
                lte: today,
            },
            goodDeed: {
                category: 'prayer',
            },
        },
        _count: {
            id: true,
        },
    });

    // Check if user completed prayers each day (at least 1 prayer per day)
    const uniqueDays = completedPrayers.length;

    let bonusPoints = 0;
    let streakDays = uniqueDays;

    if (uniqueDays >= 7) {
        bonusPoints = 100; // 7-day streak
    } else if (uniqueDays >= 15) {
        bonusPoints = 250; // 15-day streak
    } else if (uniqueDays >= 30) {
        bonusPoints = 1000; // Full Ramadan streak
    }

    return {
        hasBonus: bonusPoints > 0,
        bonusPoints,
        streakDays,
    };
}

/**
 * Complete a good deed and record it
 */
export async function completeDeed(params: {
    userId: number;
    goodDeedId?: number;
    customDeedName?: string;
    date?: Date;
    notes?: string;
    ramadanDayNumber?: number;
}): Promise<any> {
    const { userId, goodDeedId, customDeedName, notes, ramadanDayNumber } = params;
    const date = params.date || new Date();

    // Get base points from predefined deed or default
    let basePoints = 10; // Default for custom deeds

    if (goodDeedId) {
        const predefinedDeed = await prisma.predefinedGoodDeed.findUnique({
            where: { id: goodDeedId },
        });
        if (predefinedDeed) {
            basePoints = predefinedDeed.points;
        }
    }

    // Calculate points with bonuses
    const pointCalc = await calculatePoints({
        baseDeedPoints: basePoints,
        date,
        userId,
        ramadanDayNumber,
    });

    // Create completed deed record
    const completedDeed = await prisma.completedDeed.create({
        data: {
            userId,
            goodDeedId: goodDeedId || null,
            customDeedName: customDeedName || null,
            basePoints: pointCalc.basePoints,
            bonusPoints: pointCalc.bonusPoints,
            multiplier: pointCalc.multiplier,
            totalPoints: pointCalc.totalPoints,
            date: startOfDay(date),
            completedAt: new Date(),
            notes: notes || null,
            isStreakBonus: pointCalc.isStreakBonus,
            isPowerDay: pointCalc.isPowerDay,
        },
        include: {
            goodDeed: true,
        },
    });

    // Update leaderboard cache (async, don't wait)
    updateLeaderboardCache(userId, date).catch(console.error);

    return completedDeed;
}

/**
 * Get user's completed deeds history
 */
export async function getUserDeedsHistory(
    userId: number,
    period: 'today' | 'week' | 'month' | 'all' = 'all'
): Promise<any[]> {
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
        case 'today':
            startDate = startOfDay(now);
            break;
        case 'week':
            startDate = startOfWeek(now);
            break;
        case 'month':
            startDate = startOfMonth(now);
            break;
        default:
            startDate = undefined;
    }

    const deeds = await prisma.completedDeed.findMany({
        where: {
            userId,
            ...(startDate && {
                completedAt: {
                    gte: startDate,
                },
            }),
        },
        include: {
            goodDeed: true,
        },
        orderBy: {
            completedAt: 'desc',
        },
    });

    return deeds;
}

/**
 * Get user's total points
 */
export async function getUserTotalPoints(
    userId: number,
    period: 'today' | 'week' | 'month' | 'all' = 'all'
): Promise<number> {
    const deeds = await getUserDeedsHistory(userId, period);
    return deeds.reduce((total, deed) => total + deed.totalPoints, 0);
}

/**
 * Create a user goal
 */
export async function createUserGoal(params: {
    userId: number;
    goodDeedId?: number;
    customDeedName?: string;
    goalType: 'daily' | 'weekly' | 'monthly';
    targetCount: number;
    startDate: Date;
    endDate: Date;
}): Promise<any> {
    return await prisma.userGoal.create({
        data: {
            userId: params.userId,
            goodDeedId: params.goodDeedId || null,
            customDeedName: params.customDeedName || null,
            goalType: params.goalType,
            targetCount: params.targetCount,
            startDate: params.startDate,
            endDate: params.endDate,
        },
        include: {
            goodDeed: true,
        },
    });
}

/**
 * Get user goals
 */
export async function getUserGoals(
    userId: number,
    goalType?: 'daily' | 'weekly' | 'monthly'
): Promise<any[]> {
    return await prisma.userGoal.findMany({
        where: {
            userId,
            ...(goalType && { goalType }),
            isCompleted: false,
        },
        include: {
            goodDeed: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

/**
 * Update leaderboard cache for a user
 */
async function updateLeaderboardCache(userId: number, date: Date): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            districtId: true,
            divisionId: true,
            countryId: true,
        },
    });

    if (!user) return;

    const dateOnly = startOfDay(date);

    // Calculate points for different periods
    const dailyPoints = await getUserTotalPoints(userId, 'today');
    const weeklyPoints = await getUserTotalPoints(userId, 'week');
    const overallPoints = await getUserTotalPoints(userId, 'all');

    // Update caches for different scopes
    const scopes = [
        { type: 'global', id: null },
        { type: 'country', id: user.countryId },
        { type: 'division', id: user.divisionId },
        { type: 'district', id: user.districtId },
    ];

    for (const scope of scopes) {
        // Daily
        await prisma.leaderboardCache.upsert({
            where: {
                userId_period_scopeType_scopeId_date: {
                    userId: user.id,
                    period: 'daily',
                    scopeType: scope.type,
                    scopeId: scope.id || 0,
                    date: dateOnly,
                },
            },
            update: {
                totalPoints: dailyPoints,
            },
            create: {
                userId: user.id,
                period: 'daily',
                scopeType: scope.type,
                scopeId: scope.id || 0,
                totalPoints: dailyPoints,
                date: dateOnly,
            },
        });

        // Weekly
        await prisma.leaderboardCache.upsert({
            where: {
                userId_period_scopeType_scopeId_date: {
                    userId: user.id,
                    period: 'weekly',
                    scopeType: scope.type,
                    scopeId: scope.id || 0,
                    date: dateOnly,
                },
            },
            update: {
                totalPoints: weeklyPoints,
            },
            create: {
                userId: user.id,
                period: 'weekly',
                scopeType: scope.type,
                scopeId: scope.id || 0,
                totalPoints: weeklyPoints,
                date: dateOnly,
            },
        });

        // Overall
        await prisma.leaderboardCache.upsert({
            where: {
                userId_period_scopeType_scopeId_date: {
                    userId: user.id,
                    period: 'overall',
                    scopeType: scope.type,
                    scopeId: scope.id || 0,
                    date: dateOnly,
                },
            },
            update: {
                totalPoints: overallPoints,
            },
            create: {
                userId: user.id,
                period: 'overall',
                scopeType: scope.type,
                scopeId: scope.id || 0,
                totalPoints: overallPoints,
                date: dateOnly,
            },
        });
    }
}
