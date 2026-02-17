import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/locations/divisions
 * Get all divisions (optionally filtered by country)
 * Query params: countryId
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const countryId = searchParams.get('countryId');

        const divisions = await prisma.division.findMany({
            where: {
                ...(countryId && { countryId: parseInt(countryId) }),
            },
            orderBy: {
                nameEn: 'asc',
            },
        });

        return NextResponse.json({
            success: true,
            data: divisions,
        });
    } catch (error) {
        console.error('Error fetching divisions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
