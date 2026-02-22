import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET — return current preferences (or defaults)
export async function GET() {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { notificationPrefs: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const defaults = {
        fajrReminder: true,
        dhuhrReminder: true,
        asrReminder: true,
        maghribReminder: true,
        ishaReminder: true,
        leaderboardMotivation: true,
        leaderboardHour: 20,
        leaderboardMinute: 0,
    };

    const prefs = user.notificationPrefs ? { ...defaults, ...user.notificationPrefs } : defaults;

    return NextResponse.json({ success: true, data: prefs });
}

// PUT — update preferences
export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const {
        fajrReminder, dhuhrReminder, asrReminder, maghribReminder, ishaReminder,
        leaderboardMotivation, leaderboardHour, leaderboardMinute,
    } = body;

    const prefs = await (prisma as any).notificationPreferences.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            fajrReminder: fajrReminder ?? true,
            dhuhrReminder: dhuhrReminder ?? true,
            asrReminder: asrReminder ?? true,
            maghribReminder: maghribReminder ?? true,
            ishaReminder: ishaReminder ?? true,
            leaderboardMotivation: leaderboardMotivation ?? true,
            leaderboardHour: leaderboardHour ?? 20,
            leaderboardMinute: leaderboardMinute ?? 0,
        },
        update: {
            ...(fajrReminder !== undefined && { fajrReminder }),
            ...(dhuhrReminder !== undefined && { dhuhrReminder }),
            ...(asrReminder !== undefined && { asrReminder }),
            ...(maghribReminder !== undefined && { maghribReminder }),
            ...(ishaReminder !== undefined && { ishaReminder }),
            ...(leaderboardMotivation !== undefined && { leaderboardMotivation }),
            ...(leaderboardHour !== undefined && { leaderboardHour }),
            ...(leaderboardMinute !== undefined && { leaderboardMinute }),
        },
    });

    return NextResponse.json({ success: true, data: prefs });
}
