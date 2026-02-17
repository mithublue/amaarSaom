import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/deeds/predefined
 * Get all predefined good deeds
 * Query params: tier (easy|medium|hard), category
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const tier = searchParams.get('tier') as 'easy' | 'medium' | 'hard' | null;
        const category = searchParams.get('category');

        const deeds = await prisma.predefinedGoodDeed.findMany({
            where: {
                ...(tier && { tier }),
                ...(category && { category }),
            },
            orderBy: [
                { tier: 'asc' }, // easy first, then medium, then hard
                { points: 'asc' },
            ],
        });

        return NextResponse.json({
            success: true,
            data: deeds,
        });
    } catch (error) {
        console.error('Error fetching predefined deeds:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
