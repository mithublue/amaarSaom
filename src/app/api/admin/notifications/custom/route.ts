import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/adminAuth';

// GET - List scheduled notifications
export async function GET(req: NextRequest) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notifications = await prisma.customNotification.findMany({
            orderBy: { scheduledAt: 'desc' },
            take: 50
        });
        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error fetching custom notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// POST - Create a new scheduled notification
export async function POST(req: NextRequest) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { receiverEmails, title, content, scheduledAt } = body;

        if (!receiverEmails || !content || !scheduledAt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const notification = await prisma.customNotification.create({
            data: {
                receiverEmails,
                title: title || "Prophet's Companion",
                content,
                scheduledAt: new Date(scheduledAt),
                isSent: false
            }
        });

        return NextResponse.json({ success: true, data: notification });
    } catch (error) {
        console.error('Error creating custom notification:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

// DELETE - Cancel a scheduled notification
export async function DELETE(req: NextRequest) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.customNotification.delete({
            where: { id: parseInt(id.toString()) }
        });

        return NextResponse.json({ success: true, message: 'Notification canceled' });
    } catch (error) {
        console.error('Error deleting custom notification:', error);
        return NextResponse.json({ error: 'Failed to cancel notification' }, { status: 500 });
    }
}
