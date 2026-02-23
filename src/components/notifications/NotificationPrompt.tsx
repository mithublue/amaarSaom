'use client';

import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/lib/firebase/firebase';

export default function NotificationPrompt() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if we should show the prompt
        if (!('Notification' in window) || Notification.permission !== 'default') {
            return;
        }

        // Check localStorage for "ignore" flag
        const ignoredUntil = localStorage.getItem('nuzul_notif_ignored_until');
        if (ignoredUntil && Date.now() < parseInt(ignoredUntil)) {
            return;
        }

        // Delay showing the prompt to be less intrusive (5 seconds)
        const timer = setTimeout(() => {
            setShow(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

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
        // Hide for 24 hours
        const until = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('nuzul_notif_ignored_until', until.toString());
    }

    if (!show) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-gray-900/90 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 ring-1 ring-white/5">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🔔</span>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg leading-tight">
                            নোটিফিকেশন পেতে চান?
                        </h3>
                        <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
                            নামাজের সময় এবং লিডারবোর্ডের নতুন আপডেট পেতে নোটিফিকেশন সচল করুন।
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                    <button
                        onClick={handleAllow}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                    >
                        হ্যাঁ, সচল করুন
                    </button>
                    <button
                        onClick={handleDecline}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-2.5 rounded-xl transition-all active:scale-[0.98]"
                    >
                        পরে হবে
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleDecline}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
