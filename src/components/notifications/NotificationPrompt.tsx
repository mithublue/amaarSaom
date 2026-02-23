'use client';

import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/lib/firebase/firebase';
import { useSession } from 'next-auth/react';

export default function NotificationPrompt() {
    const { data: session } = useSession();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Only show for logged-in users
        if (!session?.user) return;

        // Check if we should show the prompt
        if (!('Notification' in window) || Notification.permission !== 'default') {
            return;
        }

        // Check localStorage for "ignore" flag
        const ignoredUntil = localStorage.getItem('nuzul_notif_ignored_until');
        if (ignoredUntil && Date.now() < parseInt(ignoredUntil)) {
            return;
        }

        // Delay showing the prompt (5 seconds)
        const timer = setTimeout(() => {
            setShow(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, [session]);

    async function handleAllow() {
        setShow(false);
        try {
            const token = await requestNotificationPermission();
            if (token) {
                // Sync token with server
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
            }
        } catch (err) {
            console.error('[NotificationPrompt] Error:', err);
        }
    }

    function handleDecline() {
        setShow(false);
        // Hide for 2 days to be less annoying
        const until = Date.now() + 2 * 24 * 60 * 60 * 1000;
        localStorage.setItem('nuzul_notif_ignored_until', until.toString());
    }

    if (!show) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[100] animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-gray-900/95 backdrop-blur-2xl border border-emerald-500/30 rounded-[32px] p-7 shadow-2xl shadow-emerald-500/20 ring-1 ring-white/10 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />

                <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-xl leading-tight">
                            পরকালের পাথেয় গুছিয়ে নিন! ✨
                        </h3>
                        <p className="text-gray-300 text-sm mt-2 leading-relaxed font-medium">
                            নামাজের সঠিক সময়, প্রতিদিনের নেক আমলের রিমাইন্ডার এবং লিডারবোর্ডের নতুন আপডেট পেতে নোটিফিকেশন সচল করুন।
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 mt-7">
                    <button
                        onClick={handleAllow}
                        className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-emerald-500/30 text-sm tracking-wide"
                    >
                        হ্যাঁ, সচল করি
                    </button>
                    <button
                        onClick={handleDecline}
                        className="w-full sm:flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.97] text-sm"
                    >
                        পরে দেখবো
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleDecline}
                    className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors p-1"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
