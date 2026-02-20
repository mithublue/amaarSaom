import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/adminAuth';

export async function GET() {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                countryName: true,
                cityName: true,
                createdAt: true,
                lastLoginAt: true,
                lastActiveAt: true,
                _count: {
                    select: {
                        completedDeeds: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const enrichedUsers = users.map((u) => ({
            ...u,
            totalDeeds: u._count.completedDeeds,
            isOnline: u.lastActiveAt
                ? new Date().getTime() - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000
                : false,
        }));

        return NextResponse.json({ success: true, data: enrichedUsers });
    } catch (error) {
        console.error('Admin users fetch error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
