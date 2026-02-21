'use client';

import { useEffect } from 'react';

/**
 * Global utility to report client-side errors to Slack.
 */
export async function reportClientError(params: {
    message: string;
    stack?: string;
    context?: any;
}) {
    try {
        await fetch('/api/report-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...params,
                url: typeof window !== 'undefined' ? window.location.href : undefined
            }),
        });
    } catch (error) {
        console.error('[ErrorReporter] Failed to report error:', error);
    }
}

/**
 * Component that captures unhandled promise rejections and global errors.
 */
export default function ErrorReporter() {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            reportClientError({
                message: event.message,
                stack: event.error?.stack,
                context: { filename: event.filename, lineno: event.lineno, colno: event.colno }
            });
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            reportClientError({
                message: `Unhandled Rejection: ${event.reason?.message || event.reason}`,
                stack: event.reason?.stack,
                context: { reason: event.reason }
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null;
}
