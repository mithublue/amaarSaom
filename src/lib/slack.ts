import { prisma } from './db/prisma';

interface SlackMessage {
    text: string;
    blocks?: any[];
}

/**
 * Low-level: send a raw payload to a specific Slack webhook URL.
 */
async function sendToWebhook(webhookUrl: string, payload: object): Promise<boolean> {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            console.error('[Slack] Webhook returned non-OK:', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        console.error('[Slack] sendToWebhook failed:', error);
        return false;
    }
}

/**
 * Send an activity notification using the webhook URL stored in SystemSettings (DB).
 * Used for: User Registration, Login, Page Visit, etc.
 */
export async function sendSlackNotification(message: string | SlackMessage) {
    try {
        // @ts-ignore - Prisma might not be updated yet
        const settings = await prisma.systemSettings.findFirst({
            select: { slackWebhookUrl: true }
        });
        const webhookUrl = settings?.slackWebhookUrl;
        if (!webhookUrl) {
            console.warn('[Slack] No webhook URL configured in SystemSettings');
            return false;
        }
        const payload = typeof message === 'string' ? { text: message } : message;
        return sendToWebhook(webhookUrl, payload);
    } catch (error) {
        console.error('[Slack] sendSlackNotification failed:', error);
        return false;
    }
}


/**
 * Formatted error notification for Slack
 */
export async function reportErrorToSlack(params: {
    message: string;
    stack?: string;
    context?: any;
    url?: string;
    userId?: number | string;
}) {
    const { message, stack, context, url, userId } = params;

    const blocks: any[] = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: '🚨 System Error Detected',
                emoji: true
            }
        },
        {
            type: 'section',
            fields: [
                {
                    type: 'mrkdwn',
                    text: `*Message:*\n${message}`
                },
                {
                    type: 'mrkdwn',
                    text: `*Environment:*\n${process.env.NODE_ENV}`
                }
            ]
        }
    ];

    if (url || userId) {
        blocks.push({
            type: 'section',
            fields: [
                ...(url ? [{ type: 'mrkdwn', text: `*URL:*\n${url}` }] : []),
                ...(userId ? [{ type: 'mrkdwn', text: `*User ID:*\n${userId}` }] : [])
            ]
        });
    }

    if (context) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Context:*\n\`\`\`${JSON.stringify(context, null, 2)}\`\`\``
            }
        });
    }

    if (stack) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Stack Trace:*\n\`\`\`${stack.substring(0, 2000)}\`\`\``
            }
        });
    }

    blocks.push({
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: `Timestamp: ${new Date().toLocaleString()}`
            }
        ]
    });

    // Use ERR_SLACK_HOOK_URL env variable — separate from the activity webhook in DB.
    // This keeps the error webhook secret and works even when the DB is down.
    const errorWebhookUrl = process.env.ERR_SLACK_HOOK_URL;
    if (!errorWebhookUrl) {
        console.warn('[Slack] ERR_SLACK_HOOK_URL is not set in .env — error not sent to Slack');
        return false;
    }

    return sendToWebhook(errorWebhookUrl, {
        text: `Error: ${message}`,
        blocks
    });
}
