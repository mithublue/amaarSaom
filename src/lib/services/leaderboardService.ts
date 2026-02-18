/**
 * Leaderboard Service
 * Handles leaderboard queries with filters for period and location scope
 */

import { prisma } from '../db/prisma';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';

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
 * Get leaderboard with filters using raw SQL for performance and flexibility
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

    const offset = (page - 1) * limit;
    const now = new Date();

    // Determine date filter
    let dateFilter = '';

    // Format to YYYY-MM-DD string based on local server time
    const todayStr = now.toISOString().split('T')[0];

    // Interpolate values directly to avoid Prisma queryRaw parameter binding issues with mixed inputs
    if (period === 'daily') {
        dateFilter = `AND cd.date = '${todayStr}'`;
    } else if (period === 'weekly') {
        const weekStart = startOfWeek(now); // Local date object
        const weekStartStr = weekStart.toISOString().split('T')[0];
        dateFilter = `AND cd.date >= '${weekStartStr}'`;
    }
    // 'overall' needs no date filter

    // Determine scope filter
    let scopeFilter = '';
    if (scopeType !== 'global' && scopeId) {
        // Ensure scopeId is a number to prevent injection (though params are typed)
        const safeScopeId = Number(scopeId);
        if (!isNaN(safeScopeId)) {
            if (scopeType === 'country') {
                scopeFilter = `AND u.country_id = ${safeScopeId}`;
            } else if (scopeType === 'division') {
                scopeFilter = `AND u.division_id = ${safeScopeId}`;
            } else if (scopeType === 'district') {
                scopeFilter = `AND u.district_id = ${safeScopeId}`;
            }
        }
    }

    // Common query parts
    // Construct query fragments as single valid SQL strings to prevent formatting issues

    // Simplified fetch: Get IDs and Scores first to avoid aggregation/logic issues
    const sqlSelect = `SELECT u.id as userId, SUM(cd.total_points) as totalPoints`;

    // We only need to join users for filtering by scope (ids are on user table)
    const sqlFrom = `FROM completed_deeds cd JOIN users u ON cd.user_id = u.id`;

    const sqlWhere = `WHERE 1=1 ${dateFilter} ${scopeFilter}`;
    const sqlGroup = `GROUP BY u.id`;

    // NO ORDER BY or LIMIT in SQL - we do it in JS to avoid strict mode issues
    const safeEntriesQuery = `${sqlSelect} ${sqlFrom} ${sqlWhere} ${sqlGroup}`;

    // Execute raw query
    let entries: LeaderboardEntry[] = [];
    let totalUsers = 0;

    try {
        console.log('DEBUG QUERY:', safeEntriesQuery);
        const rawResults = await prisma.$queryRawUnsafe<any[]>(safeEntriesQuery);

        // 1. Sort in JS
        const allResults = rawResults.map((r: any) => ({
            userId: Number(r.userId),
            totalPoints: Number(r.totalPoints || 0)
        })).sort((a, b) => b.totalPoints - a.totalPoints);

        totalUsers = allResults.length;

        // 2. Paginate in JS
        const paginatedResults = allResults.slice(offset, offset + limit);

        // 3. Hydrate with user details
        if (paginatedResults.length > 0) {
            const userIds = paginatedResults.map(r => r.userId);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                include: { district: true, division: true }
            });

            const userMap = new Map(users.map(u => [u.id, u]));

            entries = paginatedResults.map((item, index) => {
                const uid = item.userId;
                const user = userMap.get(uid);
                const score = item.totalPoints;

                const isCurrentUser = currentUserId && uid === currentUserId;
                // Anonymous name
                const anonymousName = `Servant of Allah ${uid.toString().slice(-4)}`;

                return {
                    rank: offset + index + 1,
                    userId: uid,
                    userName: isCurrentUser ? (user?.name || 'Unknown') : anonymousName,
                    userImage: isCurrentUser ? (user?.image || undefined) : undefined,
                    totalPoints: score,
                    location: user?.district?.nameEn || user?.division?.nameEn || 'Unknown',
                };
            });
        }

        // Count total users
        // Since we fetch all matched IDs in the first query, we can just use length
        // However, if we want total matching users without limit:
        // Actually, we fetched *all* results matching filter in safeEntriesQuery!
        // So totalUsers is just allResults.length.
        // We already set totalUsers = allResults.length above.
        // So we don't need a separate count query!

    } catch (error) {
        console.error('Error executing leaderboard query:', error);
        // Continue execution to at least return empty structure or partial data
    }

    // Get current user's rank
    let userRank: LeaderboardEntry | undefined;
    if (currentUserId) {
        try {
            const userPointsQuery = `
                SELECT SUM(cd.total_points) as totalPoints
                FROM completed_deeds cd
                JOIN users u ON cd.user_id = u.id
                WHERE u.id = ${currentUserId} ${dateFilter}
            `;

            const userPointsResult = await prisma.$queryRawUnsafe<any[]>(userPointsQuery);

            const userPoints = userPointsResult[0]?.totalPoints ? Number(userPointsResult[0].totalPoints) : 0;

            if (userPoints > 0) {
                const rankQuery = `
                    SELECT COUNT(*) as rank
                    FROM (
                        SELECT SUM(cd.total_points) as totalPoints
                        ${sqlFrom}
                        ${sqlWhere}
                        GROUP BY u.id
                    ) as scores
                    WHERE scores.totalPoints > ${userPoints}
                `;
                const rankResult = await prisma.$queryRawUnsafe<any[]>(rankQuery);
                // Rank is count of people with MORE points + 1
                const rank = Number(rankResult[0]?.rank || 0) + 1;

                // Fetch user details for the response
                const userDetails = await prisma.user.findUnique({
                    where: { id: currentUserId },
                    include: { district: true, division: true }
                });

                userRank = {
                    rank,
                    userId: currentUserId,
                    userName: userDetails?.name || 'You',
                    userImage: userDetails?.image || undefined,
                    totalPoints: userPoints,
                    location: userDetails?.district?.nameEn || userDetails?.division?.nameEn,
                };
            }
        } catch (error) {
            console.error('Error calculating user rank:', error);
        }
    }

    return {
        entries,
        userRank,
        totalUsers,
    };
}

// ... existing code ...

/**
 * Get top N users globally (helper)
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
 * Get District Leaderboard (Aggregated Scores)
 */
export async function getDistrictLeaderboard(limit: number = 20): Promise<any[]> {
    try {
        const query = `
            SELECT 
                d.id,
                d.name_en as name,
                CAST(SUM(cd.total_points) AS UNSIGNED) as totalPoints
            FROM completed_deeds cd
            JOIN users u ON cd.user_id = u.id
            JOIN districts d ON u.district_id = d.id
            GROUP BY d.id
            ORDER BY totalPoints DESC
        `;

        // Note: For full district ranking we fetch all and slice, or use window functions. 
        // For simplicity and since there are only 64 districts, fetching all is fine for now.
        const results = await prisma.$queryRawUnsafe<any[]>(query);

        const leaderboard = results.map((r: any, index: number) => ({
            rank: index + 1,
            userId: r.id, // Use District ID as userId for unique key
            userName: r.name,
            totalPoints: Number(r.totalPoints || 0)
        }));

        return leaderboard;
    } catch (error) {
        console.error('Error fetching district leaderboard:', error);
        return [];
    }
}
