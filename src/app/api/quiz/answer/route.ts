import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { processAnswer } from '@/lib/services/quizService';

/**
 * POST /api/quiz/answer
 * Submit a single answer for a quiz question.
 * Validates timing, calculates points, returns correctness + explanation.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { attemptId, questionId, selectedIndex, timeTakenMs, used5050 } = body;

        if (!attemptId || !questionId || selectedIndex === undefined || timeTakenMs === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Anti-cheat: cap time at 15000ms (server-side validation)
        const validatedTime = Math.min(Math.max(0, timeTakenMs), 15500);

        const result = await processAnswer({
            attemptId: parseInt(attemptId),
            userId,
            questionId: parseInt(questionId),
            selectedIndex: parseInt(selectedIndex),
            timeTakenMs: validatedTime,
            used5050: !!used5050,
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('[POST /api/quiz/answer]', error);
        if (error.message === 'Invalid or already completed attempt') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        if (error.message === 'Question already answered') {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
