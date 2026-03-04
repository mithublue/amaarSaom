import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { reportErrorToSlack } from '@/lib/slack';

async function getOrCreateSettings() {
    // Use raw query to bypass stale Prisma client types
    let rows = await prisma.$queryRaw<any[]>`SELECT * FROM system_settings LIMIT 1`;
    if (rows.length === 0) {
        await prisma.$executeRaw`INSERT INTO system_settings (
            slack_webhook_url, notify_on_register, notify_on_login, notify_on_visit,
            global_leaderboard_notifications, global_prayer_notifications,
            quiz_frequency, quiz_start_time, quiz_end_time, quiz_weekly_day, quiz_monthly_day, quiz_custom_date,
            updated_at
        ) VALUES (NULL, 1, 1, 0, 1, 1, 'daily', '15:00', '18:00', 5, 1, NULL, NOW())`;
        rows = await prisma.$queryRaw<any[]>`SELECT * FROM system_settings LIMIT 1`;
    }
    return rows[0];
}

function rawToSettings(raw: any) {
    return {
        id: raw.id,
        slackWebhookUrl: raw.slack_webhook_url,
        notifyOnRegister: Boolean(raw.notify_on_register),
        notifyOnLogin: Boolean(raw.notify_on_login),
        notifyOnVisit: Boolean(raw.notify_on_visit),
        globalLeaderboardNotifications: Boolean(raw.global_leaderboard_notifications),
        globalPrayerNotifications: Boolean(raw.global_prayer_notifications),
        updatedAt: raw.updated_at,
        quizFrequency: raw.quiz_frequency ?? 'daily',
        quizStartTime: raw.quiz_start_time ?? '15:00',
        quizEndTime: raw.quiz_end_time ?? '18:00',
        quizWeeklyDay: raw.quiz_weekly_day ?? 5,
        quizMonthlyDay: raw.quiz_monthly_day ?? 1,
        quizCustomDate: raw.quiz_custom_date ?? null,
    };
}

export async function GET() {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const raw = await getOrCreateSettings();
        return NextResponse.json({ success: true, data: rawToSettings(raw) });
    } catch (error) {
        console.error('Admin settings fetch error:', error);
        await reportErrorToSlack({ message: 'Error fetching admin settings', stack: (error as Error).stack, url: '/api/system-admin/settings' });
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const raw = await getOrCreateSettings();
        const id = raw.id;

        // Build update using raw SQL to bypass stale Prisma client types
        const setClauses: string[] = ['updated_at = NOW()'];
        const values: any[] = [];

        if (body.slackWebhookUrl !== undefined) { setClauses.push(`slack_webhook_url = ?`); values.push(body.slackWebhookUrl || null); }
        if (body.notifyOnRegister !== undefined) { setClauses.push(`notify_on_register = ?`); values.push(body.notifyOnRegister ? 1 : 0); }
        if (body.notifyOnLogin !== undefined) { setClauses.push(`notify_on_login = ?`); values.push(body.notifyOnLogin ? 1 : 0); }
        if (body.notifyOnVisit !== undefined) { setClauses.push(`notify_on_visit = ?`); values.push(body.notifyOnVisit ? 1 : 0); }
        if (body.globalPrayerNotifications !== undefined) { setClauses.push(`global_prayer_notifications = ?`); values.push(body.globalPrayerNotifications ? 1 : 0); }
        if (body.globalLeaderboardNotifications !== undefined) { setClauses.push(`global_leaderboard_notifications = ?`); values.push(body.globalLeaderboardNotifications ? 1 : 0); }
        if (body.quizFrequency !== undefined) { setClauses.push(`quiz_frequency = ?`); values.push(body.quizFrequency); }
        if (body.quizStartTime !== undefined) { setClauses.push(`quiz_start_time = ?`); values.push(body.quizStartTime); }
        if (body.quizEndTime !== undefined) { setClauses.push(`quiz_end_time = ?`); values.push(body.quizEndTime); }
        if (body.quizWeeklyDay !== undefined) { setClauses.push(`quiz_weekly_day = ?`); values.push(Number(body.quizWeeklyDay)); }
        if (body.quizMonthlyDay !== undefined) { setClauses.push(`quiz_monthly_day = ?`); values.push(Number(body.quizMonthlyDay)); }
        if (body.quizCustomDate !== undefined) { setClauses.push(`quiz_custom_date = ?`); values.push(body.quizCustomDate ? new Date(body.quizCustomDate) : null); }

        // Execute raw update
        await prisma.$executeRawUnsafe(
            `UPDATE system_settings SET ${setClauses.join(', ')} WHERE id = ?`,
            ...values,
            id
        );

        const updated = await getOrCreateSettings();
        return NextResponse.json({ success: true, data: rawToSettings(updated) });
    } catch (error) {
        console.error('Admin settings update error:', error);
        await reportErrorToSlack({ message: 'Error updating admin settings', stack: (error as Error).stack, url: '/api/system-admin/settings (PATCH)' });
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
