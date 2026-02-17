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
    const queryParams: any[] = [];

    if (period === 'daily') {
        dateFilter = 'AND cd.date = ?';
        queryParams.push(startOfDay(now));
    } else if (period === 'weekly') {
        dateFilter = 'AND cd.date >= ?';
        queryParams.push(startOfWeek(now));
    }
    // 'overall' needs no date filter

    // Determine scope filter
    let scopeFilter = '';
    if (scopeType !== 'global' && scopeId) {
        if (scopeType === 'country') {
            scopeFilter = 'AND u.country_id = ?';
        } else if (scopeType === 'division') {
            scopeFilter = 'AND u.division_id = ?';
        } else if (scopeType === 'district') {
            scopeFilter = 'AND u.district_id = ?';
        }
        queryParams.push(scopeId);
    }

    // Common query parts
    const sqlSelect = `
        SELECT 
            u.id as userId, 
            u.name as userName, 
            u.image as userImage, 
            CAST(SUM(cd.total_points) AS UNSIGNED) as totalPoints,
            COALESCE(dist.name_en, div.name_en, 'Unknown') as location
    `;

    const sqlFrom = `
        FROM completed_deeds cd
        JOIN users u ON cd.user_id = u.id
        LEFT JOIN districts dist ON u.district_id = dist.id
        LEFT JOIN divisions div ON u.division_id = div.id
    `;

    const sqlWhere = `WHERE 1=1 ${dateFilter} ${scopeFilter}`;
    const sqlGroup = `GROUP BY u.id`;
    const sqlOrder = `ORDER BY totalPoints DESC`;

    // Fetch paginated entries
    const entriesQuery = `
        ${sqlSelect}
        ${sqlFrom}
        ${sqlWhere}
        ${sqlGroup}
        ${sqlOrder}
        LIMIT ? OFFSET ?
    `;

    // Execute raw query
    const entriesParams = [...queryParams, limit, offset];
    let entries: LeaderboardEntry[] = [];
    let totalUsers = 0;

    try {
        const rawEntries = await prisma.$queryRawUnsafe<any[]>(entriesQuery, ...entriesParams);

        // Map to interface with masked names for privacy
        entries = rawEntries.map((entry: any, index: number) => {
            // Simple masking strategy: "Servant of Allah {ID}" or similar anonymous name
            const isCurrentUser = currentUserId && Number(entry.userId) === currentUserId;
            const anonymousName = `Servant of Allah ${Number(entry.userId).toString().slice(-4)}`; // unique-ish suffix

            return {
                rank: offset + index + 1,
                userId: Number(entry.userId),
                userName: isCurrentUser ? entry.userName : anonymousName, // Show real name only to self
                userImage: isCurrentUser ? entry.userImage : undefined, // Hide images too
                totalPoints: Number(entry.totalPoints || 0),
                location: entry.location,
            };
        });

        // Count total users
        const countQuery = `
            SELECT COUNT(DISTINCT cd.user_id) as count
            ${sqlFrom}
            ${sqlWhere}
        `;
        const totalCountResult = await prisma.$queryRawUnsafe<any[]>(countQuery, ...queryParams);
        totalUsers = Number(totalCountResult[0]?.count || 0);

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
                WHERE u.id = ? ${dateFilter}
            `;

            const dateParams = period === 'daily' || period === 'weekly' ? [queryParams[0]] : [];
            const userPointsResult = await prisma.$queryRawUnsafe<any[]>(userPointsQuery, currentUserId, ...dateParams);

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
                    WHERE scores.totalPoints > ?
                `;
                const rankResult = await prisma.$queryRawUnsafe<any[]>(rankQuery, ...queryParams, userPoints);
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
