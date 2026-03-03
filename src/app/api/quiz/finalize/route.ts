import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { finalizeQuizAttempt } from '@/lib/services/quizService';

/**
 * POST /api/quiz/finalize
 * Called after all questions are answered.
 * Applies streak multiplier, updates quiz profile & leaderboard cache.
 * Does NOT touch User.lifetimePoints or main LeaderboardCache.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { attemptId } = body;

        if (!attemptId) {
            return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
        }

        const result = await finalizeQuizAttempt(parseInt(attemptId), userId);

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('[POST /api/quiz/finalize]', error);
        if (error.message === 'Invalid or already completed attempt') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
