import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getCommunityLeaderboard } from '@/lib/services/leaderboardService';
import { auth } from '@/lib/auth/config';

/**
 * GET /api/leaderboard
 * Get leaderboard rankings
 * Query params: period (daily|weekly|overall), scope (global|division|district), scopeId, page, limit
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const searchParams = request.nextUrl.searchParams;

        const period = (searchParams.get('period') as 'daily' | 'weekly' | 'overall') || 'overall';
        const scope = (searchParams.get('scope') as 'global' | 'country' | 'division' | 'district') || 'global';
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
