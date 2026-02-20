'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignOutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSignOut() {
        setLoading(true);
        await signOut({ callbackUrl: '/' });
    }

    return (
        <main className="min-h-screen bg-primary-950 flex items-center justify-center px-4 py-12">

            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                <div className="bg-primary-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass text-center">

                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                        </div>
                    </div>

                    {/* Header */}
                    <h1 className="text-2xl font-bold text-white mb-2">Sign Out</h1>
                    <p className="text-sm text-primary-400 mb-8">
                        Are you sure you want to sign out of Nuzul?
                    </p>

                    {/* Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleSignOut}
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                    Signing out...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                    </svg>
                                    Yes, sign me out
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => router.back()}
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                        >
                            Cancel — Go back
                        </button>
                    </div>

                    {/* Moon branding */}
                    <p className="mt-6 text-xs text-primary-600">🌙 Nuzul</p>
                </div>
            </div>
        </main>
    );
}
