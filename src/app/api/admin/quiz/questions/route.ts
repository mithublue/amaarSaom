import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/quiz/questions — list all questions with filters
 * POST /api/admin/quiz/questions — create a new question
 */

export async function GET(request: NextRequest) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 20;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
        where.OR = [
            { questionBn: { contains: search } },
            { questionEn: { contains: search } },
        ];
    }

    const [questions, total] = await Promise.all([
        prisma.quizQuestion.findMany({
            where,
            orderBy: { id: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.quizQuestion.count({ where }),
    ]);

    const stats = await prisma.quizQuestion.groupBy({
        by: ['category'],
        _count: { id: true },
    });

    const attemptCount = await prisma.quizAttempt.count();
    const profileCount = await prisma.userQuizProfile.count();

    return NextResponse.json({
        success: true,
        data: { questions, total, page, pageSize, stats, attemptCount, profileCount },
    });
}

export async function POST(request: NextRequest) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const {
        questionBn, questionEn,
        optionsBn, optionsEn,
        correctIndex,
        explanationBn, explanationEn,
        category, difficulty,
    } = body;

    if (!questionBn || !Array.isArray(optionsBn) || optionsBn.length < 2 || !category) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const question = await prisma.quizQuestion.create({
        data: {
            questionBn,
            questionEn: questionEn || null,
            questionAr: null,
            optionsBn,
            optionsEn: (optionsEn && Array.isArray(optionsEn) && optionsEn.length > 0) ? optionsEn : [],
            optionsAr: [],
            correctIndex: parseInt(correctIndex),
            explanationBn: explanationBn || null,
            explanationEn: explanationEn || null,
            explanationAr: null,
            category,
            difficulty: difficulty || 'medium',
        },
    });

    return NextResponse.json({ success: true, data: question }, { status: 201 });
}
