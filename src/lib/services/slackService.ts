import { prisma } from '@/lib/db/prisma';

export type SlackEvent = 'register' | 'login' | 'visit';

interface SlackPayload {
    text: string;
    blocks?: any[];
}

async function getSettings() {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
        settings = await prisma.systemSettings.create({ data: {} });
    }
    return settings;
}

function isEventEnabled(settings: any, event: SlackEvent): boolean {
    switch (event) {
        case 'register': return settings.notifyOnRegister;
        case 'login': return settings.notifyOnLogin;
        case 'visit': return settings.notifyOnVisit;
        default: return false;
    }
}

function getEventEmoji(event: SlackEvent): string {
    switch (event) {
        case 'register': return '🆕';
        case 'login': return '🔑';
        case 'visit': return '👁️';
    }
}

function getEventLabel(event: SlackEvent): string {
    switch (event) {
        case 'register': return 'New Registration';
        case 'login': return 'User Login';
        case 'visit': return 'Page Visit';
    }
}

export async function sendSlackNotification(
    event: SlackEvent,
    data: { userName?: string; email?: string; extra?: string }
): Promise<boolean> {
    try {
        const settings = await getSettings();

        if (!settings.slackWebhookUrl || !isEventEnabled(settings, event)) {
            return false;
        }

        const emoji = getEventEmoji(event);
        const label = getEventLabel(event);
        const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

        const payload: SlackPayload = {
            text: `${emoji} *${label}* — ${data.userName || data.email || 'Unknown'}`,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `${emoji} *${label}*`,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*User:*\n${data.userName || 'N/A'}` },
                        { type: 'mrkdwn', text: `*Email:*\n${data.email || 'N/A'}` },
                        { type: 'mrkdwn', text: `*Time (BD):*\n${time}` },
                        ...(data.extra ? [{ type: 'mrkdwn', text: `*Info:*\n${data.extra}` }] : []),
                    ],
                },
                { type: 'divider' },
            ],
        };

        const res = await fetch(settings.slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return res.ok;
    } catch (error) {
        console.error('Slack notification error:', error);
        return false;
    }
}
