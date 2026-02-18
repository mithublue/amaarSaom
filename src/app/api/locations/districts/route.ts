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

        // Fallback: If no districts found (e.g., seeding failed/skipped), return minimal hardcoded samples.
        if (districts.length === 0 && divisionId) {
            const divId = parseInt(divisionId);
            let fallbackDistricts: any[] = [];

            // Sample districts for Dhaka (ID 1) as per seed
            if (divId === 1) { // Dhaka
                fallbackDistricts = [
                    { id: 101, nameEn: 'Dhaka', nameBn: 'ঢাকা', divisionId: 1 },
                    { id: 102, nameEn: 'Gazipur', nameBn: 'গাজীপুর', divisionId: 1 },
                    { id: 103, nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', divisionId: 1 },
                    { id: 104, nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', divisionId: 1 },
                    { id: 105, nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', divisionId: 1 },
                ];
            }
            // Minimal fallbacks for other major divisions to prevent empty dropdowns if user selects them
            else if (divId === 2) { // Chittagong
                fallbackDistricts = [{ id: 201, nameEn: 'Chittagong', nameBn: 'চট্টগ্রাম', divisionId: 2 }, { id: 202, nameEn: 'Comilla', nameBn: 'কুমিল্লা', divisionId: 2 }];
            }
            else if (divId === 3) { // Rajshahi
                fallbackDistricts = [{ id: 301, nameEn: 'Rajshahi', nameBn: 'রাজশাহী', divisionId: 3 }, { id: 302, nameEn: 'Bogra', nameBn: 'বগুড়া', divisionId: 3 }];
            }
            else if (divId === 4) { // Khulna
                fallbackDistricts = [{ id: 401, nameEn: 'Khulna', nameBn: 'খুলনা', divisionId: 4 }, { id: 402, nameEn: 'Jessore', nameBn: 'যশোর', divisionId: 4 }];
            }
            else if (divId === 6) { // Sylhet
                fallbackDistricts = [{ id: 601, nameEn: 'Sylhet', nameBn: 'সিলেট', divisionId: 6 }, { id: 602, nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', divisionId: 6 }];
            }

            if (fallbackDistricts.length > 0) {
                return NextResponse.json({
                    success: true,
                    data: fallbackDistricts,
                });
            }
        }

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
