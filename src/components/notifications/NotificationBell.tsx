'use client';

import { useState, useEffect } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/firebase';

export default function NotificationBell() {
    const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission as any);
        }

        // Register firebase messaging service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then((reg) => console.log('FCM SW registered:', reg.scope))
                .catch((err) => console.error('FCM SW registration failed:', err));
        }

        // Listen for foreground messages
        const unsubscribe = onForegroundMessage((payload) => {
            console.log('Foreground message:', payload);
            setToast(payload.notification?.title || 'New notification');
            setTimeout(() => setToast(null), 4000);
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    async function enableNotifications() {
        setLoading(true);
        try {
            const token = await requestNotificationPermission();

            if (token) {
                // Save token to backend
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
                setPermission('granted');
                setToast('🔔 Notifications enabled!');
                setTimeout(() => setToast(null), 3000);
            } else {
                setPermission(Notification.permission as any);
            }
        } catch (error) {
            console.error('Failed to enable notifications:', error);
        }
        setLoading(false);
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
    }

    return (
        <>
            {/* Toast for foreground notifications */}
            {toast && (
                <div className="fixed top-4 right-4 z-[100] animate-slide-down">
                    <div className="bg-emerald-600/90 backdrop-blur-lg text-white px-5 py-3 rounded-xl shadow-xl border border-emerald-500/30 flex items-center gap-2">
                        <span>🔔</span>
                        <span className="text-sm font-medium">{toast}</span>
                    </div>
                </div>
            )}

            {/* Bell button */}
            {permission !== 'granted' && (
                <button
                    onClick={enableNotifications}
                    disabled={loading || permission === 'denied'}
                    title={permission === 'denied' ? 'Notifications blocked in browser settings' : 'Enable notifications'}
                    className={`relative p-2 rounded-xl transition-all ${permission === 'denied'
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 hover:text-emerald-400 hover:bg-white/5'
                        }`}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                    )}
                    {permission === 'default' && !loading && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </button>
            )}
        </>
    );
}
