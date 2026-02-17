import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: {
                district: true,
                division: true,
                country: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/user/profile
 * Update user's profile (location, language)
 * Body: { name?, districtId?, divisionId?, countryId?, language? }
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, districtId, divisionId, countryId, language } = body;

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(session.user.id) },
            data: {
                ...(name && { name }),
                ...(districtId && { districtId: parseInt(districtId) }),
                ...(divisionId && { divisionId: parseInt(divisionId) }),
                ...(countryId && { countryId: parseInt(countryId) }),
                ...(language && { language }),
            },
            include: {
                district: true,
                division: true,
                country: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully!',
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
