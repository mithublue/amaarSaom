import { NextRequest, NextResponse } from 'next/server';
import { reportErrorToSlack } from '@/lib/slack';
import { auth } from '@/lib/auth/config';

/**
 * POST /api/report-error
 * Allows client-side components to report errors to Slack.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const body = await request.json();
        const { message, stack, context, url } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        await reportErrorToSlack({
            message,
            stack,
            context,
            url,
            userId: session?.user?.id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[ReportErrorAPI] Error reporting to Slack:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
