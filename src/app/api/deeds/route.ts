import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { completeDeed, getUserDeedsHistory, getUserTotalPoints } from '@/lib/services/deedsService';
import { reportErrorToSlack } from '@/lib/slack';

/**
 * GET /api/deeds/history
 * Get user's completed deeds history
 * Query params: period (today|week|month|all)
 */
export async function GET(request: NextRequest) {
    let session;
    try {
        session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const period = (searchParams.get('period') as 'today' | 'week' | 'month' | 'all') || 'all';

        const deeds = await getUserDeedsHistory(parseInt(session.user.id), period);
        const totalPoints = await getUserTotalPoints(parseInt(session.user.id), period);

        return NextResponse.json({
            success: true,
            data: {
                deeds,
                totalPoints,
                period,
            },
        });
    } catch (error) {
        console.error('Error fetching deed history:', error);
        await reportErrorToSlack({
            message: 'Error fetching deed history',
            stack: (error as Error).stack,
            url: `/api/deeds?period=${request.nextUrl.searchParams.get('period') || 'all'}`,
            userId: session?.user?.id
        });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/deeds/complete
 * Mark a good deed as completed
 * Body: { goodDeedId?, customDeedName?, notes?, ramadanDayNumber? }
 */
export async function POST(request: NextRequest) {
    let session;
    try {
        session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { goodDeedId, customDeedName, notes, ramadanDayNumber } = body;

        if (!goodDeedId && !customDeedName) {
            return NextResponse.json(
                { error: 'Either goodDeedId or customDeedName is required' },
                { status: 400 }
            );
        }

        const completedDeed = await completeDeed({
            userId: parseInt(session.user.id),
            goodDeedId: goodDeedId ? parseInt(goodDeedId) : undefined,
            customDeedName,
            notes,
            ramadanDayNumber,
        });

        return NextResponse.json({
            success: true,
            data: completedDeed,
            message: `Great! You earned ${completedDeed.totalPoints} points! 🌟`,
        });
    } catch (error) {
        console.error('Error completing deed:', error);
        await reportErrorToSlack({
            message: 'Error completing deed',
            stack: (error as Error).stack,
            url: '/api/deeds (POST)',
            userId: session?.user?.id
        });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
