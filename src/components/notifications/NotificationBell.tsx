'use client';

import { useState, useEffect } from 'react';
import { onForegroundMessage } from '@/lib/firebase/firebase';
import { requestNotificationPermission } from '@/lib/firebase/firebase';

// Hidden by default — only appears when a new push notification is received
export default function NotificationBell() {
    const [notifications, setNotifications] = useState<{ title: string; body?: string }[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Silently request permission and register token on mount
        (async () => {
            if (!('Notification' in window)) return;
            if (Notification.permission === 'default') {
                const token = await requestNotificationPermission();
                if (token) {
                    await fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token }),
                    }).catch(() => { });
                }
            } else if (Notification.permission === 'granted') {
                // Already granted — just get the token silently
                const { getToken } = await import('firebase/messaging');
                const { getMessagingInstance } = await import('@/lib/firebase/firebase') as any;
                // re-use existing token registration via subscribe API
                const token = await requestNotificationPermission().catch(() => null);
                if (token) {
                    await fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token }),
                    }).catch(() => { });
                }
            }
        })();

        // Register service worker for background notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => { });
        }

        // Listen for foreground messages — show bell with red dot
        const unsubscribe = onForegroundMessage((payload) => {
            const title = payload.notification?.title || 'New notification';
            const body = payload.notification?.body;
            setNotifications((prev) => [...prev, { title, body }]);
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    // Nothing to show
    if (notifications.length === 0) return null;

    function dismiss() {
        setNotifications([]);
        setOpen(false);
    }

    const latest = notifications[notifications.length - 1];

    return (
        <div className="relative">
            {/* Bell button — only appears when there are notifications */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 rounded-xl text-gray-400 hover:text-emerald-400 hover:bg-white/5 transition-all"
                title="New notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {/* Red dot */}
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-10 w-72 z-50 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span className="text-white text-sm font-semibold">Notifications</span>
                        <button
                            onClick={dismiss}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            Clear all
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                        {notifications.slice().reverse().map((n, i) => (
                            <div key={i} className="px-4 py-3">
                                <p className="text-white text-sm font-medium">{n.title}</p>
                                {n.body && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{n.body}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
