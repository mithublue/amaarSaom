import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getDistrictLeaderboard, getHallOfFame } from '@/lib/services/leaderboardService';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/leaderboard
 * Get leaderboard rankings
 * Query params: period (daily|weekly|overall), scope (global|division|district), scopeId, page, limit
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);

        const period = (searchParams.get('period') as any) || 'weekly';
        const scope = (searchParams.get('scope') as any) || 'global';

        // Special case for District Rankings
        if (scope === 'district_ranking') {
            const allDistricts = await getDistrictLeaderboard();
            let myDistrictRank = null;

            if (session?.user?.id) {
                // Get user's district
                const user = await prisma.user.findUnique({
                    where: { id: parseInt(session.user.id) },
                    select: { districtId: true }
                });

                if (user?.districtId) {
                    myDistrictRank = allDistricts.find(d => d.userId === user.districtId) || null;
                }
            }

            // Return top limit (e.g. 50) and the user's district rank
            return NextResponse.json({
                success: true,
                data: {
                    entries: allDistricts.slice(0, 50),
                    userRank: myDistrictRank,
                    totalUsers: allDistricts.length
                }
            });
        }

        // Special case for Hall of Fame
        if (scope === 'hall_of_fame') {
            const hallOfFame = await getHallOfFame();

            // Also get current user's level
            let userLevel = null;
            if (session?.user?.id) {
                const { getUserTotalPoints } = await import('@/lib/services/deedsService');
                const userPoints = await getUserTotalPoints(parseInt(session.user.id), 'month');

                const { calculateUserLevel } = await import('@/lib/gamification');
                userLevel = calculateUserLevel(userPoints);
            }

            return NextResponse.json({
                success: true,
                data: {
                    distribution: hallOfFame,
                    userLevel: userLevel ? {
                        level: userLevel.level,
                        nameKey: userLevel.nameKey
                    } : null
                }
            });
        }

        // ... rest of user leaderboard logic ...
        const scopeId = searchParams.get('scopeId') ? parseInt(searchParams.get('scopeId')!) : undefined;
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

        const currentUserId = session?.user?.id ? parseInt(session.user.id) : undefined;

        const leaderboard = await getLeaderboard({
            period,
            scopeType: scope,
            scopeId,
            page,
            limit,
            currentUserId,
        });

        return NextResponse.json({
            success: true,
            data: leaderboard,
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
