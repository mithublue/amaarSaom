import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/adminAuth';

async function getOrCreateSettings() {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
        settings = await prisma.systemSettings.create({ data: {} });
    }
    return settings;
}

export async function GET() {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const settings = await getOrCreateSettings();
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error('Admin settings fetch error:', error);
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
        const settings = await getOrCreateSettings();

        const updated = await prisma.systemSettings.update({
            where: { id: settings.id },
            data: {
                ...(body.slackWebhookUrl !== undefined && { slackWebhookUrl: body.slackWebhookUrl }),
                ...(body.notifyOnRegister !== undefined && { notifyOnRegister: body.notifyOnRegister }),
                ...(body.notifyOnLogin !== undefined && { notifyOnLogin: body.notifyOnLogin }),
                ...(body.notifyOnVisit !== undefined && { notifyOnVisit: body.notifyOnVisit }),
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin settings update error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
