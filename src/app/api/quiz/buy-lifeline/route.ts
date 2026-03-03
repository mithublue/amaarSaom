import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

const LIFELINE_COSTS: Record<string, number> = {
    '5050': 200,
    'streak_saver': 500,
};

/**
 * POST /api/quiz/buy-lifeline
 * Spend quiz points (totalQuizPoints) to buy lifelines.
 * Does NOT deduct from User.lifetimePoints.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { type } = body;

        if (!type || !LIFELINE_COSTS[type]) {
            return NextResponse.json({ error: 'Invalid lifeline type. Use "5050" or "streak_saver"' }, { status: 400 });
        }

        const cost = LIFELINE_COSTS[type];

        // Get quiz profile
        const profile = await prisma.userQuizProfile.findUnique({ where: { userId } });
        if (!profile) {
            return NextResponse.json({ error: 'Quiz profile not found. Play a quiz first.' }, { status: 404 });
        }

        if (profile.totalQuizPoints < cost) {
            return NextResponse.json({
                error: `Insufficient quiz points. You have ${profile.totalQuizPoints} but need ${cost}.`,
                currentPoints: profile.totalQuizPoints,
                cost,
            }, { status: 400 });
        }

        // Deduct and credit
        const updateData: any = { totalQuizPoints: { decrement: cost } };
        if (type === '5050') updateData.lifelines5050 = { increment: 1 };
        if (type === 'streak_saver') updateData.streakSavers = { increment: 1 };

        const updatedProfile = await prisma.userQuizProfile.update({
            where: { userId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: `Successfully purchased ${type === '5050' ? '50/50 lifeline' : 'Streak Saver'}!`,
            data: {
                totalQuizPoints: updatedProfile.totalQuizPoints,
                lifelines5050: updatedProfile.lifelines5050,
                streakSavers: updatedProfile.streakSavers,
            },
        });
    } catch (error) {
        console.error('[POST /api/quiz/buy-lifeline]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
