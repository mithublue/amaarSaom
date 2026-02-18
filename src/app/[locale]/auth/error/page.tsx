'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const getErrorContent = (error: string | null) => {
        switch (error) {
            case 'AccessDenied':
                return {
                    title: 'Access Denied',
                    message: 'You do not have permission to sign in.',
                    icon: '🚫',
                };
            case 'Verification':
                return {
                    title: 'Unable to Verify',
                    message: 'The sign in link is no longer valid. It may have been used already or it may have expired.',
                    icon: '⚠️',
                };
            case 'Configuration':
                return {
                    title: 'Server Error',
                    message: 'There is a problem with the server configuration. Please check the server logs.',
                    icon: '🔧',
                };
            default:
                return {
                    title: 'Authentication Error',
                    message: 'An unexpected error occurred during authentication. Please try again.',
                    icon: '❌',
                };
        }
    };

    const { title, message, icon } = getErrorContent(error);

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 text-center max-w-md w-full">
            <div className="text-6xl mb-6">{icon}</div>
            <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
            <p className="text-primary-200 mb-8">{message}</p>

            <div className="space-y-4">
                <Link
                    href="/auth/signin"
                    className="block w-full px-6 py-3 bg-accent text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-accent/80 transition-all"
                >
                    Try Again
                </Link>
                <Link
                    href="/"
                    className="block w-full px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 flex items-center justify-center px-4">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
