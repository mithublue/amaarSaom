import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

export async function POST(req: Request) {
    const session = await auth();

    try {
        const { token, cityName, countryName, timezone, language } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        let userId: number | null = null;
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
            });
            if (user) {
                userId = user.id;
            }
        }

        // Upsert subscription (avoid duplicates)
        // If user is logged in, we link it. If not, userId is null.
        await prisma.pushSubscription.upsert({
            where: { token },
            update: {
                userId: userId as any,
                cityName,
                countryName,
                timezone,
                language: language || 'bn',
                updatedAt: new Date()
            },
            create: {
                userId: userId as any,
                token,
                cityName,
                countryName,
                timezone,
                language: language || 'bn',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push subscribe error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
