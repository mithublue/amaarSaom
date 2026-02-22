'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { requestNotificationPermission } from '@/lib/firebase/firebase';

interface NotifPrefs {
    fajrReminder: boolean;
    dhuhrReminder: boolean;
    asrReminder: boolean;
    maghribReminder: boolean;
    ishaReminder: boolean;
    prayerReminder: boolean;
    leaderboardMotivation: boolean;
    leaderboardHour: number;
    leaderboardMinute: number;
}

const DEFAULTS: NotifPrefs = {
    fajrReminder: true,
    dhuhrReminder: true,
    asrReminder: true,
    maghribReminder: true,
    ishaReminder: true,
    prayerReminder: true,
    leaderboardMotivation: true,
    leaderboardHour: 20,
    leaderboardMinute: 0,
};

const PRAYERS: { key: keyof Pick<NotifPrefs, 'fajrReminder' | 'dhuhrReminder' | 'asrReminder' | 'maghribReminder' | 'ishaReminder'>; label: string; emoji: string; time: string }[] = [
    { key: 'fajrReminder', label: 'Fajr', emoji: '🌙', time: 'pre-dawn' },
    { key: 'dhuhrReminder', label: 'Dhuhr', emoji: '☀️', time: 'midday' },
    { key: 'asrReminder', label: 'Asr', emoji: '🌤️', time: 'afternoon' },
    { key: 'maghribReminder', label: 'Maghrib', emoji: '🌅', time: 'sunset' },
    { key: 'ishaReminder', label: 'Isha', emoji: '🌃', time: 'night' },
];

type ToggleKey = keyof Pick<NotifPrefs, 'fajrReminder' | 'dhuhrReminder' | 'asrReminder' | 'maghribReminder' | 'ishaReminder' | 'prayerReminder' | 'leaderboardMotivation'>;

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${on ? 'bg-emerald-600' : 'bg-primary-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}

export default function NotificationSettingsPanel() {
    const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
    const [permStatus, setPermStatus] = useState<'unknown' | 'granted' | 'denied' | 'loading'>('unknown');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermStatus(Notification.permission as 'granted' | 'denied' | 'default' === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'unknown');
        }
        fetch('/api/notifications/preferences')
            .then(r => r.json())
            .then(d => { if (d.success && d.data) setPrefs(p => ({ ...p, ...d.data })); })
            .catch(() => { });
    }, []);

    const handleEnableNotifications = async () => {
        setPermStatus('loading');
        try {
            const token = await requestNotificationPermission();
            if (!token) {
                setPermStatus('denied');
                toast.error('Notification permission denied or browser not supported.');
                return;
            }
            const res = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            if (res.ok) {
                setPermStatus('granted');
                toast.success('Push notifications enabled! 🔔');
            } else {
                setPermStatus('unknown');
                toast.error('Failed to register device.');
            }
        } catch {
            setPermStatus('denied');
            toast.error('Failed to enable notifications.');
        }
    };

    const toggle = (key: ToggleKey) => setPrefs(p => ({ ...p, [key]: !p[key] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs),
            });
            if (res.ok) toast.success('Preferences saved ✅');
            else toast.error('Failed to save preferences.');
        } catch {
            toast.error('Could not reach server.');
        } finally {
            setSaving(false);
        }
    };

    const timeStr = `${String(prefs.leaderboardHour).padStart(2, '0')}:${String(prefs.leaderboardMinute).padStart(2, '0')}`;
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [h, m] = e.target.value.split(':').map(Number);
        setPrefs(p => ({ ...p, leaderboardHour: h ?? 0, leaderboardMinute: m ?? 0 }));
    };

    return (
        <div className="space-y-5">

            {/* ── Master Enable ── */}
            <div className="bg-primary-800/30 p-5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-semibold">🔔 Enable Push Notifications</h4>
                        <p className="text-xs text-primary-400 mt-1">Allow this site to send push notifications to your device.</p>
                    </div>
                    {permStatus === 'granted' ? (
                        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-500/30">✓ Enabled</span>
                    ) : permStatus === 'denied' ? (
                        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-900/40 text-red-300 border border-red-500/30">Blocked</span>
                    ) : permStatus === 'loading' ? (
                        <span className="px-3 py-1.5 text-xs text-primary-400 animate-pulse">Requesting…</span>
                    ) : (
                        <button onClick={handleEnableNotifications}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors">
                            Enable
                        </button>
                    )}
                </div>
                {permStatus === 'denied' && (
                    <p className="mt-3 text-xs text-red-300 bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                        ⚠️ Blocked by browser. Click the 🔒 lock icon in the address bar → allow notifications → reload the page.
                    </p>
                )}
            </div>

            {/* ── Prayer Reminders ── */}
            <div className="bg-primary-800/30 rounded-xl border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                    <h4 className="text-white font-semibold flex items-center justify-between">
                        <span>🕌 Prayer Reminders</span>
                        <Toggle on={prefs.prayerReminder} onClick={() => toggle('prayerReminder')} />
                    </h4>
                    <p className="text-xs text-primary-400 mt-1">
                        Sent 15–20 minutes after each prayer — includes dhikr & dua reminders.
                    </p>
                </div>
                {prefs.prayerReminder && PRAYERS.map(({ key, label, emoji, time }) => (
                    <div key={key} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{emoji}</span>
                            <div>
                                <p className="text-sm font-medium text-white">{label}</p>
                                <p className="text-xs text-primary-500">{time}</p>
                            </div>
                        </div>
                        <Toggle on={prefs[key]} onClick={() => toggle(key as ToggleKey)} />
                    </div>
                ))}
            </div>

            {/* ── Leaderboard Motivation ── */}
            <div className="bg-primary-800/30 p-5 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-semibold">🏆 Leaderboard Motivation</h4>
                        <p className="text-xs text-primary-400 mt-1">Daily nudge with your competitor's score and an amal suggestion to catch up.</p>
                    </div>
                    <Toggle on={prefs.leaderboardMotivation} onClick={() => toggle('leaderboardMotivation')} />
                </div>
                {prefs.leaderboardMotivation && (
                    <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                        <label className="text-sm text-primary-300 font-medium whitespace-nowrap">Notify me at:</label>
                        <input
                            type="time"
                            value={timeStr}
                            onChange={handleTimeChange}
                            className="bg-primary-900 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-emerald-500/50"
                        />
                        <span className="text-xs text-primary-500">(your local timezone)</span>
                    </div>
                )}
            </div>

            {/* ── Save ── */}
            <div className="flex flex-col items-end gap-2">
                <button
                    onClick={handleSave}
                    disabled={saving || permStatus !== 'granted'}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow"
                >
                    {saving ? 'Saving…' : 'Save Preferences'}
                </button>
                {permStatus !== 'granted' && (
                    <p className="text-xs text-primary-500">Enable notifications first to save preferences.</p>
                )}
            </div>
        </div>
    );
}
