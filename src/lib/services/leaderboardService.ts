/**
 * Leaderboard Service
 * Handles leaderboard queries with filters for period and location scope
 */

import { prisma } from '../db/prisma';
import { getCached, setCache } from '../db/redis';
import { startOfDay } from 'date-fns';

const LEADERBOARD_CACHE_TTL = 900; // 15 minutes

export interface LeaderboardEntry {
    rank: number;
    userId: number;
    userName: string;
    userImage?: string;
    totalPoints: number;
    location?: string;
}

export interface LeaderboardResponse {
    entries: LeaderboardEntry[];
    userRank?: LeaderboardEntry;
    totalUsers: number;
}

/**
 * Get leaderboard with filters
 */
export async function getLeaderboard(params: {
    period: 'daily' | 'weekly' | 'overall';
    scopeType: 'global' | 'country' | 'division' | 'district';
    scopeId?: number;
    page?: number;
    limit?: number;
    currentUserId?: number;
}): Promise<LeaderboardResponse> {
    const {
        period,
        scopeType,
        scopeId,
        page = 1,
        limit = 50,
        currentUserId,
    } = params;

    const date = startOfDay(new Date());
    const cacheKey = `leaderboard:${period}:${scopeType}:${scopeId || 'null'}:${page}:${limit}`;

    // Try cache first
    const cached = await getCached<LeaderboardResponse>(cacheKey);
    if (cached) {
        console.log('✅ Leaderboard retrieved from cache');
        return cached;
    }

    // Query leaderboard from database
    const offset = (page - 1) * limit;

    const leaderboardData = await prisma.leaderboardCache.findMany({
        where: {
            period,
            scopeType,
            ...(scopeId && { scopeId }),
            date,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    district: {
                        select: {
                            nameEn: true,
                            nameBn: true,
                        },
                    },
                    division: {
                        select: {
                            nameEn: true,
                            nameBn: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            totalPoints: 'desc',
        },
        take: limit,
        skip: offset,
    });

    // Calculate ranks
    const entries: LeaderboardEntry[] = leaderboardData.map((entry, index) => ({
        rank: offset + index + 1,
        userId: entry.user.id,
        userName: entry.user.name,
        userImage: entry.user.image || undefined,
        totalPoints: entry.totalPoints,
        location: entry.user.district?.nameEn || entry.user.division?.nameEn,
    }));

    // Get current user's rank if provided
    let userRank: LeaderboardEntry | undefined;
    if (currentUserId) {
        const userEntry = await prisma.leaderboardCache.findUnique({
            where: {
                userId_period_scopeType_scopeId_date: {
                    userId: currentUserId,
                    period,
                    scopeType,
                    scopeId: scopeId || 0,
                    date,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        district: {
                            select: {
                                nameEn: true,
                            },
                        },
                    },
                },
            },
        });

        if (userEntry) {
            // Calculate user's actual rank
            const rankCount = await prisma.leaderboardCache.count({
                where: {
                    period,
                    scopeType,
                    ...(scopeId && { scopeId }),
                    date,
                    totalPoints: {
                        gt: userEntry.totalPoints,
                    },
                },
            });

            userRank = {
                rank: rankCount + 1,
                userId: userEntry.user.id,
                userName: userEntry.user.name,
                userImage: userEntry.user.image || undefined,
                totalPoints: userEntry.totalPoints,
                location: userEntry.user.district?.nameEn,
            };
        }
    }

    // Count total users
    const totalUsers = await prisma.leaderboardCache.count({
        where: {
            period,
            scopeType,
            ...(scopeId && { scopeId }),
            date,
        },
    });

    const response: LeaderboardResponse = {
        entries,
        userRank,
        totalUsers,
    };

    // Cache the result
    await setCache(cacheKey, response, LEADERBOARD_CACHE_TTL);
    console.log('✅ Leaderboard fetched from DB and cached');

    return response;
}

/**
 * Get top N users globally
 */
export async function getTopUsers(limit: number = 5): Promise<LeaderboardEntry[]> {
    const leaderboard = await getLeaderboard({
        period: 'overall',
        scopeType: 'global',
        limit,
    });

    return leaderboard.entries;
}

/**
 * Get community leaderboard (division/district-based)
 */
export async function getCommunityLeaderboard(params: {
    divisionId?: number;
    districtId?: number;
    period?: 'daily' | 'weekly' | 'overall';
    limit?: number;
}): Promise<LeaderboardResponse> {
    const { divisionId, districtId, period = 'overall', limit = 50 } = params;

    if (districtId) {
        return await getLeaderboard({
            period,
            scopeType: 'district',
            scopeId: districtId,
            limit,
        });
    } else if (divisionId) {
        return await getLeaderboard({
            period,
            scopeType: 'division',
            scopeId: divisionId,
            limit,
        });
    }

    // Fallback to global
    return await getLeaderboard({
        period,
        scopeType: 'global',
        limit,
    });
}
