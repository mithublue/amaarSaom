import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/locations/districts
 * Get all districts (optionally filtered by division)
 * Query params: divisionId
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const divisionId = searchParams.get('divisionId');

        const districts = await prisma.district.findMany({
            where: {
                ...(divisionId && { divisionId: parseInt(divisionId) }),
            },
            orderBy: {
                nameEn: 'asc',
            },
        });

        return NextResponse.json({
            success: true,
            data: districts,
        });
    } catch (error) {
        console.error('Error fetching districts:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
