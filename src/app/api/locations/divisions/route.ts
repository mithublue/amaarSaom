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

        // Fallback: If no divisions found (e.g., seeding failed/skipped), return hardcoded list for Bangladesh.
        if (divisions.length === 0 && (!countryId || countryId === '1')) {
            const fallbackDivisions = [
                { id: 1, nameEn: 'Dhaka', nameBn: 'ঢাকা', nameAr: 'دكا', countryId: 1 },
                { id: 2, nameEn: 'Chittagong', nameBn: 'চট্টগ্রাম', nameAr: 'شيتاغونغ', countryId: 1 },
                { id: 3, nameEn: 'Rajshahi', nameBn: 'রाজশাহী', nameAr: 'راجشاهي', countryId: 1 },
                { id: 4, nameEn: 'Khulna', nameBn: 'খুলনা', nameAr: 'خولنا', countryId: 1 },
                { id: 5, nameEn: 'Barishal', nameBn: 'বরিশাল', nameAr: 'باريسال', countryId: 1 },
                { id: 6, nameEn: 'Sylhet', nameBn: 'সিলেট', nameAr: 'سيلهيت', countryId: 1 },
                { id: 7, nameEn: 'Rangpur', nameBn: 'রংপুর', nameAr: 'رانغبور', countryId: 1 },
                { id: 8, nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', nameAr: 'ميمنسينغ', countryId: 1 },
            ];

            // Sort fallback by nameEn to match expected behavior
            fallbackDivisions.sort((a, b) => a.nameEn.localeCompare(b.nameEn));

            return NextResponse.json({
                success: true,
                data: fallbackDivisions,
            });
        }

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
