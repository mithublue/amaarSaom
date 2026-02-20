'use client';

import { useState, useEffect } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    image: string | null;
    countryName: string | null;
    cityName: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    lastActiveAt: string | null;
    totalDeeds: number;
    isOnline: boolean;
}

interface Settings {
    id: number;
    slackWebhookUrl: string | null;
    notifyOnRegister: boolean;
    notifyOnLogin: boolean;
    notifyOnVisit: boolean;
}

type Tab = 'users' | 'settings';

export default function AdminDashboard() {
    const [tab, setTab] = useState<Tab>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [webhookInput, setWebhookInput] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [usersRes, settingsRes] = await Promise.all([
                fetch('/api/system-admin/users'),
                fetch('/api/system-admin/settings'),
            ]);
            const usersData = await usersRes.json();
            const settingsData = await settingsRes.json();

            if (usersData.success) setUsers(usersData.data);
            if (settingsData.success) {
                setSettings(settingsData.data);
                setWebhookInput(settingsData.data.slackWebhookUrl || '');
            }
        } catch (err) {
            console.error('Failed to load admin data:', err);
        }
        setLoading(false);
    }

    async function saveSettings() {
        if (!settings) return;
        setSaving(true);
        setSaveMsg('');
        try {
            const res = await fetch('/api/system-admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slackWebhookUrl: webhookInput,
                    notifyOnRegister: settings.notifyOnRegister,
                    notifyOnLogin: settings.notifyOnLogin,
                    notifyOnVisit: settings.notifyOnVisit,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.data);
                setSaveMsg('✅ Settings saved successfully!');
            } else {
                setSaveMsg('❌ Failed to save settings.');
            }
        } catch {
            setSaveMsg('❌ Network error.');
        }
        setSaving(false);
        setTimeout(() => setSaveMsg(''), 3000);
    }

    function toggleSetting(key: 'notifyOnRegister' | 'notifyOnLogin' | 'notifyOnVisit') {
        if (!settings) return;
        setSettings({ ...settings, [key]: !settings[key] });
    }

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🛡️</span>
                        <h1 className="text-xl font-bold text-white">System Admin</h1>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Owner
                        </span>
                    </div>
                    <a
                        href="/"
                        className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
                    >
                        ← Back to App
                    </a>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="flex gap-1 bg-gray-900/60 p-1 rounded-xl w-fit border border-white/5">
                    <button
                        onClick={() => setTab('users')}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'users'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        👥 Users ({users.length})
                    </button>
                    <button
                        onClick={() => setTab('settings')}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'settings'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {tab === 'users' && (
                    <div className="space-y-4">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Total Users" value={users.length} icon="👥" color="emerald" />
                            <StatCard
                                label="Online Now"
                                value={users.filter((u) => u.isOnline).length}
                                icon="🟢"
                                color="green"
                            />
                            <StatCard
                                label="Today's Logins"
                                value={
                                    users.filter(
                                        (u) =>
                                            u.lastLoginAt &&
                                            new Date(u.lastLoginAt).toDateString() === new Date().toDateString()
                                    ).length
                                }
                                icon="🔑"
                                color="blue"
                            />
                            <StatCard
                                label="Total Deeds"
                                value={users.reduce((acc, u) => acc + u.totalDeeds, 0)}
                                icon="✨"
                                color="amber"
                            />
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                        </div>

                        {/* Users Table */}
                        <div className="bg-gray-900/40 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                                                Location
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                                                Joined
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Last Login
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                                                Deeds
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-white/[0.02] transition"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            {user.image ? (
                                                                <img
                                                                    src={user.image}
                                                                    alt={user.name}
                                                                    className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-emerald-600/30 flex items-center justify-center text-sm font-bold text-emerald-400 border-2 border-white/10">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            {user.isOnline && (
                                                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-950"></span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400 hidden md:table-cell">
                                                    {user.cityName && user.countryName
                                                        ? `${user.cityName}, ${user.countryName}`
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400 hidden md:table-cell">
                                                    {formatDate(user.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {formatDate(user.lastLoginAt)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.isOnline
                                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                                                                }`}
                                                        ></span>
                                                        {user.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-gray-400 hidden md:table-cell">
                                                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium">
                                                        {user.totalDeeds}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    No users found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'settings' && settings && (
                    <div className="max-w-2xl space-y-6">
                        {/* Slack Webhook */}
                        <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">💬</span>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Slack Integration</h2>
                                    <p className="text-sm text-gray-500">
                                        Send real-time notifications to your Slack workspace
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Webhook URL</label>
                                <input
                                    type="url"
                                    value={webhookInput}
                                    onChange={(e) => setWebhookInput(e.target.value)}
                                    placeholder="https://hooks.slack.com/services/..."
                                    className="w-full bg-gray-800/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Notification Toggles */}
                        <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">🔔</span>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Notification Events</h2>
                                    <p className="text-sm text-gray-500">
                                        Choose which events trigger Slack notifications
                                    </p>
                                </div>
                            </div>

                            <ToggleRow
                                label="User Registration"
                                description="When a new user signs up via Google OAuth"
                                icon="🆕"
                                enabled={settings.notifyOnRegister}
                                onToggle={() => toggleSetting('notifyOnRegister')}
                            />
                            <ToggleRow
                                label="User Login"
                                description="When an existing user signs in"
                                icon="🔑"
                                enabled={settings.notifyOnLogin}
                                onToggle={() => toggleSetting('notifyOnLogin')}
                            />
                            <ToggleRow
                                label="Page Visit"
                                description="When any user visits a page (high volume)"
                                icon="👁️"
                                enabled={settings.notifyOnVisit}
                                onToggle={() => toggleSetting('notifyOnVisit')}
                            />
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                            >
                                {saving ? '⏳ Saving...' : '💾 Save Settings'}
                            </button>
                            {saveMsg && (
                                <span className="text-sm animate-fade-in">{saveMsg}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Sub-components ---

function StatCard({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: number;
    icon: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        emerald: 'from-emerald-500/10 border-emerald-500/20 text-emerald-400',
        green: 'from-green-500/10 border-green-500/20 text-green-400',
        blue: 'from-blue-500/10 border-blue-500/20 text-blue-400',
        amber: 'from-amber-500/10 border-amber-500/20 text-amber-400',
    };

    return (
        <div
            className={`bg-gradient-to-br ${colorMap[color]} to-transparent border rounded-2xl p-5`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
        </div>
    );
}

function ToggleRow({
    label,
    description,
    icon,
    enabled,
    onToggle,
}: {
    label: string;
    description: string;
    icon: string;
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? 'bg-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-gray-700'
                    }`}
            >
                <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${enabled ? 'left-[26px]' : 'left-0.5'
                        }`}
                ></span>
            </button>
        </div>
    );
}
