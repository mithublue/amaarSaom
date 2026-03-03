import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { prisma } from '@/lib/db/prisma';

/**
 * PATCH /api/admin/quiz/questions/[id] — update a question
 * DELETE /api/admin/quiz/questions/[id] — delete a question
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    const body = await request.json();

    const {
        questionBn, questionEn,
        correctIndex,
        explanationBn, explanationEn,
        category, difficulty,
    } = body;

    const question = await prisma.quizQuestion.update({
        where: { id },
        data: {
            ...(questionBn !== undefined && { questionBn }),
            ...(questionEn !== undefined && { questionEn }),
            ...(correctIndex !== undefined && { correctIndex: parseInt(correctIndex) }),
            ...(explanationBn !== undefined && { explanationBn }),
            ...(explanationEn !== undefined && { explanationEn }),
            ...(category !== undefined && { category }),
            ...(difficulty !== undefined && { difficulty }),
        },
    });

    return NextResponse.json({ success: true, data: question });
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    await prisma.quizQuestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
