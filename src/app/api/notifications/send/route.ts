import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { sendPushNotification } from '@/lib/firebase/firebaseAdmin';

export async function POST(req: Request) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { title, body, data } = await req.json();

        if (!title || !body) {
            return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
        }

        // Get all FCM tokens
        const subscriptions = await prisma.pushSubscription.findMany({
            select: { token: true },
        });

        if (subscriptions.length === 0) {
            return NextResponse.json({ success: true, sent: 0, message: 'No subscribers' });
        }

        const tokens = subscriptions.map((s) => s.token);
        const result = await sendPushNotification(tokens, title, body, data);

        return NextResponse.json({
            success: true,
            sent: result.success,
            failed: result.failure,
            total: tokens.length,
        });
    } catch (error) {
        console.error('Push send error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
