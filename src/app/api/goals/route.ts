import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createUserGoal, getUserGoals } from '@/lib/services/deedsService';

/**
 * GET /api/goals
 * Get user's goals
 * Query params: type (daily|weekly|monthly)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const goalType = searchParams.get('type') as 'daily' | 'weekly' | 'monthly' | undefined;

        const goals = await getUserGoals(parseInt(session.user.id), goalType);

        return NextResponse.json({
            success: true,
            data: goals,
        });
    } catch (error) {
        console.error('Error fetching goals:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/goals
 * Create a new goal
 * Body: { goodDeedId?, customDeedName?, goalType, targetCount, startDate, endDate }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { goodDeedId, customDeedName, goalType, targetCount, startDate, endDate } = body;

        if (!goalType || !targetCount || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const goal = await createUserGoal({
            userId: parseInt(session.user.id),
            goodDeedId: goodDeedId ? parseInt(goodDeedId) : undefined,
            customDeedName,
            goalType,
            targetCount: parseInt(targetCount),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        });

        return NextResponse.json({
            success: true,
            data: goal,
            message: 'Goal created successfully! 🎯',
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
