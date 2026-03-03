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
    globalPrayerNotifications: boolean;
    globalLeaderboardNotifications: boolean;
}

type Tab = 'users' | 'settings' | 'quiz';

interface QuizQuestion {
    id: number;
    questionBn: string;
    questionEn: string | null;
    optionsBn: unknown;
    optionsEn: unknown | null;
    correctIndex: number;
    explanationBn: string | null;
    explanationEn: string | null;
    category: string;
    difficulty: string;
}

interface QuizStats {
    questions: QuizQuestion[];
    total: number;
    page: number;
    pageSize: number;
    stats: { category: string; _count: { id: number } }[];
    attemptCount: number;
    profileCount: number;
}

export default function AdminDashboard() {
    const [tab, setTab] = useState<Tab>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [webhookInput, setWebhookInput] = useState('');
    const [goldPrice, setGoldPrice] = useState<any>(null);
    const [goldSaving, setGoldSaving] = useState(false);
    const [goldMsg, setGoldMsg] = useState('');
    const [manualGold, setManualGold] = useState({ gold22kGram: '', gold24kGram: '', gold21kGram: '', gold18kGram: '', silverPerGram: '' });
    const [showManualGold, setShowManualGold] = useState(false);

    // Custom Notification State
    const [showNotifForm, setShowNotifForm] = useState(false);
    const [notifData, setNotifData] = useState({
        receiverEmails: '',
        title: "Prophet's Companion",
        content: '',
        scheduledAt: new Date(Date.now() + 10 * 60 * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    });
    const [notifSaving, setNotifSaving] = useState(false);
    const [notifMsg, setNotifMsg] = useState('');
    const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

    // Quiz state
    const [quizData, setQuizData] = useState<QuizStats | null>(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizSearch, setQuizSearch] = useState('');
    const [quizCategory, setQuizCategory] = useState('');
    const [quizPage, setQuizPage] = useState(1);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingQ, setEditingQ] = useState<QuizQuestion | null>(null);
    const [quizMsg, setQuizMsg] = useState('');
    const [newQ, setNewQ] = useState({
        questionBn: '', questionEn: '',
        opt0Bn: '', opt1Bn: '', opt2Bn: '', opt3Bn: '',
        opt0En: '', opt1En: '', opt2En: '', opt3En: '',
        correctIndex: '0',
        explanationBn: '', explanationEn: '',
        category: 'quran', difficulty: 'medium',
    });

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
            // Load gold price
            const gpRes = await fetch('/api/gold-price');
            const gpData = await gpRes.json();
            if (gpData.success) setGoldPrice(gpData.data);

            // Load custom notifications
            const cnRes = await fetch('/api/admin/notifications/custom');
            const cnData = await cnRes.json();
            if (cnData.success) setRecentNotifs(cnData.data);
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
                    globalPrayerNotifications: settings.globalPrayerNotifications,
                    globalLeaderboardNotifications: settings.globalLeaderboardNotifications,
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

    async function deleteUser(id: number, name: string) {
        if (!confirm(`Are you sure you want to completely remove user: ${name}? This action cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/system-admin/users?id=${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.filter((u) => u.id !== id));
            } else {
                alert('Failed to delete user: ' + (data.error || 'Unknown error'));
            }
        } catch {
            alert('Network error while trying to delete user.');
        }
    }

    async function saveCustomNotification() {
        setNotifSaving(true);
        setNotifMsg('');
        try {
            // Convert the local datetime-local string to a proper UTC ISO string
            const payload = {
                ...notifData,
                scheduledAt: new Date(notifData.scheduledAt).toISOString()
            };

            const res = await fetch('/api/admin/notifications/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                setNotifMsg('✅ Notification scheduled successfully!');
                setNotifData({ ...notifData, content: '', receiverEmails: '' });
                loadData(); // Refresh list
            } else {
                setNotifMsg('❌ ' + (data.error || 'Failed to save.'));
            }
        } catch {
            setNotifMsg('❌ Network error.');
        }
        setNotifSaving(false);
        setTimeout(() => setNotifMsg(''), 4000);
    }

    async function deleteCustomNotification(id: number) {
        if (!confirm('Are you sure you want to cancel this scheduled notification?')) return;
        try {
            const res = await fetch('/api/admin/notifications/custom', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.success) {
                setRecentNotifs(recentNotifs.filter(n => n.id !== id));
            } else {
                alert('Failed to delete: ' + data.error);
            }
        } catch {
            alert('Network error.');
        }
    }

    function toggleSetting(key: 'notifyOnRegister' | 'notifyOnLogin' | 'notifyOnVisit' | 'globalPrayerNotifications' | 'globalLeaderboardNotifications') {
        if (!settings) return;
        setSettings({ ...settings, [key]: !settings[key] });
    }

    async function loadQuizData() {
        setQuizLoading(true);
        try {
            const params = new URLSearchParams({ page: String(quizPage) });
            if (quizSearch) params.set('search', quizSearch);
            if (quizCategory) params.set('category', quizCategory);
            const res = await fetch(`/api/admin/quiz/questions?${params}`);
            const data = await res.json();
            if (data.success) setQuizData(data.data);
        } catch (e) { console.error(e); }
        setQuizLoading(false);
    }

    async function saveNewQuestion() {
        const optionsBn = [newQ.opt0Bn, newQ.opt1Bn, newQ.opt2Bn, newQ.opt3Bn].filter(Boolean);
        const optionsEn = [newQ.opt0En, newQ.opt1En, newQ.opt2En, newQ.opt3En].filter(Boolean);
        if (!newQ.questionBn || optionsBn.length < 2) {
            setQuizMsg('❌ বাংলা প্রশ্ন এবং কমপক্ষে ২টি অপশন আবশ্যিক।');
            return;
        }
        try {
            const res = await fetch('/api/admin/quiz/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionBn: newQ.questionBn, questionEn: newQ.questionEn || null,
                    optionsBn, optionsEn: optionsEn.length === optionsBn.length ? optionsEn : null,
                    correctIndex: parseInt(newQ.correctIndex),
                    explanationBn: newQ.explanationBn || null, explanationEn: newQ.explanationEn || null,
                    category: newQ.category, difficulty: newQ.difficulty,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setQuizMsg('✅ প্রশ্ন যোগ সফল!');
                setShowAddForm(false);
                setNewQ({ questionBn: '', questionEn: '', opt0Bn: '', opt1Bn: '', opt2Bn: '', opt3Bn: '', opt0En: '', opt1En: '', opt2En: '', opt3En: '', correctIndex: '0', explanationBn: '', explanationEn: '', category: 'quran', difficulty: 'medium' });
                loadQuizData();
            } else setQuizMsg('❌ ' + (data.error || 'সমস্যা হয়েছে।'));
        } catch { setQuizMsg('❌ Network error.'); }
        setTimeout(() => setQuizMsg(''), 4000);
    }

    async function saveEditQuestion() {
        if (!editingQ) return;
        try {
            const res = await fetch(`/api/admin/quiz/questions/${editingQ.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionBn: editingQ.questionBn, questionEn: editingQ.questionEn,
                    explanationBn: editingQ.explanationBn, explanationEn: editingQ.explanationEn,
                    category: editingQ.category, difficulty: editingQ.difficulty,
                    correctIndex: editingQ.correctIndex,
                }),
            });
            const data = await res.json();
            if (data.success) { setQuizMsg('✅ আপডেট সফল!'); setEditingQ(null); loadQuizData(); }
            else setQuizMsg('❌ ' + (data.error || 'সমস্যা।'));
        } catch { setQuizMsg('❌ Network error.'); }
        setTimeout(() => setQuizMsg(''), 3000);
    }

    async function deleteQuestion(id: number) {
        if (!confirm('এই প্রশ্নটি মুছে দেবেন?')) return;
        try {
            const res = await fetch(`/api/admin/quiz/questions/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { setQuizMsg('✅ মুছে দেওয়া হয়েছে।'); loadQuizData(); }
            else setQuizMsg('❌ ' + data.error);
        } catch { setQuizMsg('❌ Network error.'); }
        setTimeout(() => setQuizMsg(''), 3000);
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
                    <button
                        onClick={() => { setTab('quiz'); loadQuizData(); }}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'quiz'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        🧠 Quiz Manager
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
                                            <th className="text-right px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
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
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => deleteUser(user.id, user.name)}
                                                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                        title="Remove User"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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

                            <div className="pt-4 border-t border-white/5">
                                <h3 className="text-sm font-semibold text-emerald-400 mb-4 tracking-wider uppercase">Global Push Notifications</h3>
                                <div className="space-y-4">
                                    <ToggleRow
                                        label="Global Prayer Reminders"
                                        description="Master switch for all prayer time push notifications"
                                        icon="🕌"
                                        enabled={settings.globalPrayerNotifications}
                                        onToggle={() => toggleSetting('globalPrayerNotifications')}
                                    />
                                    <ToggleRow
                                        label="Global Leaderboard Motivation"
                                        description="Master switch for daily leaderboard motivational nudges"
                                        icon="🏆"
                                        enabled={settings.globalLeaderboardNotifications}
                                        onToggle={() => toggleSetting('globalLeaderboardNotifications')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Gold & Silver Price */}
                        <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🪙</span>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Gold & Silver Prices</h2>
                                        <p className="text-sm text-gray-500">Used for Zakat Calculator — fetched from BAJUS</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowManualGold(!showManualGold)}
                                        className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition"
                                    >✎ Manual</button>
                                    <button
                                        onClick={async () => {
                                            setGoldSaving(true); setGoldMsg('');
                                            const r = await fetch('/api/system-admin/scrape-gold', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                                            const d = await r.json();
                                            if (d.success) { setGoldPrice(d.data); setGoldMsg('✅ Prices updated from BAJUS!'); }
                                            else setGoldMsg('❌ ' + (d.error || 'Scraping failed — try manual.'));
                                            setGoldSaving(false); setTimeout(() => setGoldMsg(''), 4000);
                                        }}
                                        disabled={goldSaving}
                                        className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                                    >{goldSaving ? '⏳' : '🔄 Refresh BAJUS'}</button>
                                </div>
                            </div>

                            {/* Current prices display */}
                            {goldPrice && (
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    {[['22K Gold/g', goldPrice.gold22kGram], ['24K Gold/g', goldPrice.gold24kGram], ['Silver/g', goldPrice.silverPerGram]].map(([l, v]) => (
                                        <div key={l as string} className="bg-gray-800/60 rounded-xl p-3 text-center">
                                            <p className="text-gray-400 text-xs">{l as string}</p>
                                            <p className="text-white font-bold">৳{parseFloat(String(v)).toFixed(0)}</p>
                                        </div>
                                    ))}
                                    <p className="col-span-3 text-xs text-gray-600">
                                        Source: {goldPrice.source} {goldPrice.fetchedAt ? '• ' + new Date(goldPrice.fetchedAt).toLocaleString() : '• defaults'}
                                    </p>
                                </div>
                            )}

                            {/* Manual entry */}
                            {showManualGold && (
                                <div className="space-y-3 pt-2 border-t border-white/5">
                                    <p className="text-sm text-gray-400">Enter prices per gram (BDT):</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[['gold22kGram', '22K Gold'], ['gold24kGram', '24K Gold'], ['gold21kGram', '21K Gold'], ['gold18kGram', '18K Gold'], ['silverPerGram', 'Silver']].map(([k, label]) => (
                                            <div key={k}>
                                                <label className="text-xs text-gray-500 block mb-1">{label}/gram</label>
                                                <input type="number" value={(manualGold as any)[k]} onChange={e => setManualGold(g => ({ ...g, [k]: e.target.value }))}
                                                    placeholder="0" className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50" />
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setGoldSaving(true); setGoldMsg('');
                                            const r = await fetch('/api/system-admin/scrape-gold', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ manual: true, ...manualGold }) });
                                            const d = await r.json();
                                            if (d.success) { setGoldPrice(d.data); setGoldMsg('✅ Manual prices saved!'); setShowManualGold(false); }
                                            else setGoldMsg('❌ ' + d.error);
                                            setGoldSaving(false); setTimeout(() => setGoldMsg(''), 3000);
                                        }}
                                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-xl transition"
                                    >💾 Save Manual Prices</button>
                                </div>
                            )}
                            {goldMsg && <p className="text-sm">{goldMsg}</p>}
                        </div>

                        {/* Send Custom Notification Toggle & Form */}
                        <div className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📢</span>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Custom Notifications</h2>
                                        <p className="text-sm text-gray-500">Send direct push messages to specific users</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNotifForm(!showNotifForm)}
                                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${showNotifForm ? 'bg-emerald-600' : 'bg-gray-700'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${showNotifForm ? 'left-[26px]' : 'left-0.5'}`}></span>
                                </button>
                            </div>

                            {showNotifForm && (
                                <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Receiver Emails (comma separated)</label>
                                        <textarea
                                            value={notifData.receiverEmails}
                                            onChange={e => setNotifData({ ...notifData, receiverEmails: e.target.value })}
                                            placeholder="user1@example.com, user2@example.com"
                                            rows={2}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Notification Title</label>
                                        <input
                                            type="text"
                                            value={notifData.title}
                                            onChange={e => setNotifData({ ...notifData, title: e.target.value })}
                                            placeholder="Title"
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Message Content</label>
                                        <textarea
                                            value={notifData.content}
                                            onChange={e => setNotifData({ ...notifData, content: e.target.value })}
                                            placeholder="What do you want to say?"
                                            rows={3}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Schedule Time</label>
                                        <input
                                            type="datetime-local"
                                            value={notifData.scheduledAt}
                                            onChange={e => setNotifData({ ...notifData, scheduledAt: e.target.value })}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <button
                                        onClick={saveCustomNotification}
                                        disabled={notifSaving}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                                    >
                                        {notifSaving ? '⏳ Saving...' : '📅 Schedule Notification'}
                                    </button>
                                    {notifMsg && <p className="text-center text-sm font-medium text-emerald-400">{notifMsg}</p>}

                                    {/* Recent list */}
                                    {recentNotifs.length > 0 && (
                                        <div className="pt-4 mt-4 border-t border-white/5">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Recent Scheduled Messages</h4>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                {recentNotifs.map((n: any) => (
                                                    <div key={n.id} className="bg-gray-800/40 rounded-lg p-3 border border-white/5 flex justify-between items-center text-xs">
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <p className="text-white font-medium truncate">{n.content}</p>
                                                            <p className="text-gray-500 mt-0.5">To: {n.receiverEmails.slice(0, 30)}...</p>
                                                        </div>
                                                        <div className="text-right flex items-center gap-3">
                                                            <div>
                                                                <p className={n.isSent ? "text-emerald-400" : "text-amber-400"}>
                                                                    {n.isSent ? '✅ Sent' : '⏳ Pending'}
                                                                </p>
                                                                <p className="text-gray-500 mt-0.5">{new Date(n.scheduledAt).toLocaleDateString()} {new Date(n.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                            {!n.isSent && (
                                                                <button
                                                                    onClick={() => deleteCustomNotification(n.id)}
                                                                    className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition"
                                                                    title="Cancel notification"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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

                {/* ── QUIZ MANAGER TAB ── */}
                {tab === 'quiz' && (
                    <div className="space-y-6">
                        {/* Status message */}
                        {quizMsg && (
                            <div className="bg-gray-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm animate-fade-in">
                                {quizMsg}
                            </div>
                        )}

                        {/* Stats Row */}
                        {quizData && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="মোট প্রশ্ন" value={quizData.total} icon="🧠" color="blue" />
                                <StatCard label="মোট অ্যাটেম্পট" value={quizData.attemptCount} icon="🎯" color="emerald" />
                                <StatCard label="কুইজ প্লেয়ার" value={quizData.profileCount} icon="👤" color="amber" />
                                <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-5">
                                    <p className="text-2xl mb-1">📚</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {quizData.stats.map(s => (
                                            <span key={s.category} className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                                                {s.category}: {s._count.id}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5">Categories</p>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                            <div className="flex gap-2 flex-1 flex-wrap">
                                <input
                                    type="text"
                                    placeholder="🔍 প্রশ্ন খুঁজুন..."
                                    value={quizSearch}
                                    onChange={e => setQuizSearch(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { setQuizPage(1); loadQuizData(); } }}
                                    className="flex-1 min-w-[200px] bg-gray-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                                />
                                <select
                                    value={quizCategory}
                                    onChange={e => { setQuizCategory(e.target.value); setQuizPage(1); loadQuizData(); }}
                                    className="bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="">সব ক্যাটাগরি</option>
                                    {['quran', 'seerah', 'fiqh', 'hadith', 'general', 'boss'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => { setQuizPage(1); loadQuizData(); }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition"
                                >
                                    খুঁজুন
                                </button>
                            </div>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shrink-0"
                            >
                                {showAddForm ? '✕ বাদ দিন' : '+ নতুন প্রশ্ন'}
                            </button>
                        </div>

                        {/* Add Question Form */}
                        {showAddForm && (
                            <div className="bg-gray-900/70 border border-blue-500/20 rounded-2xl p-6 space-y-4">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">🧠 নতুন প্রশ্ন যোগ করুন</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">প্রশ্ন (বাংলা) *</label>
                                        <textarea
                                            value={newQ.questionBn}
                                            onChange={e => setNewQ({ ...newQ, questionBn: e.target.value })}
                                            rows={2}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                            placeholder="বাংলায় প্রশ্ন লিখুন..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Question (English)</label>
                                        <textarea
                                            value={newQ.questionEn}
                                            onChange={e => setNewQ({ ...newQ, questionEn: e.target.value })}
                                            rows={2}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                            placeholder="English question (optional)..."
                                        />
                                    </div>
                                </div>

                                {/* Options */}
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block">অপশনগুলো (কমপক্ষে ২টি বাংলা) — সঠিক উত্তর নম্বর নিচে সিলেক্ট করুন</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {([0, 1, 2, 3] as const).map(i => (
                                            <div key={i} className={`border rounded-xl p-2 space-y-1 ${parseInt(newQ.correctIndex) === i ? 'border-green-500/50 bg-green-500/5' : 'border-white/5'}`}>
                                                <p className="text-[10px] text-gray-500">{['ক', 'খ', 'গ', 'ঘ'][i]} {parseInt(newQ.correctIndex) === i ? '✅' : ''}</p>
                                                <input
                                                    placeholder={`অপশন ${i + 1} (বাং)`}
                                                    value={newQ[`opt${i}Bn` as keyof typeof newQ] as string}
                                                    onChange={e => setNewQ({ ...newQ, [`opt${i}Bn`]: e.target.value })}
                                                    className="w-full bg-gray-700 border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                                                />
                                                <input
                                                    placeholder={`Option ${i + 1} (EN)`}
                                                    value={newQ[`opt${i}En` as keyof typeof newQ] as string}
                                                    onChange={e => setNewQ({ ...newQ, [`opt${i}En`]: e.target.value })}
                                                    className="w-full bg-gray-700 border border-white/5 rounded-lg px-2 py-1 text-xs text-gray-400 focus:outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">সঠিক উত্তর</label>
                                        <select
                                            value={newQ.correctIndex}
                                            onChange={e => setNewQ({ ...newQ, correctIndex: e.target.value })}
                                            className="w-full bg-gray-800 border border-green-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                        >
                                            {[0, 1, 2, 3].map(i => <option key={i} value={i}>{['ক', 'খ', 'গ', 'ঘ'][i]} (অপশন {i + 1})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">ক্যাটাগরি</label>
                                        <select
                                            value={newQ.category}
                                            onChange={e => setNewQ({ ...newQ, category: e.target.value })}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                        >
                                            {['quran', 'seerah', 'fiqh', 'hadith', 'general', 'boss'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">ডিফিকাল্টি</label>
                                        <select
                                            value={newQ.difficulty}
                                            onChange={e => setNewQ({ ...newQ, difficulty: e.target.value })}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                        >
                                            {['easy', 'medium', 'hard', 'boss'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">ব্যাখ্যা (বাংলা)</label>
                                        <textarea
                                            value={newQ.explanationBn}
                                            onChange={e => setNewQ({ ...newQ, explanationBn: e.target.value })}
                                            rows={2}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                            placeholder="সঠিক উত্তরের ব্যাখ্যা..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Explanation (EN)</label>
                                        <textarea
                                            value={newQ.explanationEn}
                                            onChange={e => setNewQ({ ...newQ, explanationEn: e.target.value })}
                                            rows={2}
                                            className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                            placeholder="English explanation..."
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={saveNewQuestion}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition"
                                >
                                    ✅ প্রশ্ন সেভ করুন
                                </button>
                            </div>
                        )}

                        {/* Question List */}
                        {quizLoading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : (
                            <div className="bg-gray-900/40 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                    <p className="text-sm text-gray-400">
                                        মোট <span className="text-white font-bold">{quizData?.total || 0}</span> প্রশ্ন
                                        {quizData && ` — পেইজ ${quizData.page} / ${Math.ceil(quizData.total / quizData.pageSize)}`}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setQuizPage(Math.max(1, quizPage - 1)); loadQuizData(); }}
                                            disabled={quizPage <= 1}
                                            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white rounded-lg transition"
                                        >← আগে</button>
                                        <button
                                            onClick={() => { setQuizPage(quizPage + 1); loadQuizData(); }}
                                            disabled={!quizData || quizPage * quizData.pageSize >= quizData.total}
                                            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white rounded-lg transition"
                                        >পরে →</button>
                                    </div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {quizData?.questions.map(q => (
                                        <div key={q.id} className="px-4 py-3 hover:bg-white/[0.02] transition group">
                                            {editingQ?.id === q.id ? (
                                                /* Edit mode */
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <textarea
                                                            value={editingQ.questionBn}
                                                            onChange={e => setEditingQ({ ...editingQ, questionBn: e.target.value })}
                                                            rows={2}
                                                            className="bg-gray-700 border border-blue-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none w-full"
                                                        />
                                                        <textarea
                                                            value={editingQ.questionEn || ''}
                                                            onChange={e => setEditingQ({ ...editingQ, questionEn: e.target.value })}
                                                            rows={2}
                                                            className="bg-gray-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none w-full"
                                                            placeholder="English..."
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        <div>
                                                            <label className="text-[10px] text-gray-500">সঠিক উত্তর</label>
                                                            <select
                                                                value={editingQ.correctIndex}
                                                                onChange={e => setEditingQ({ ...editingQ, correctIndex: parseInt(e.target.value) })}
                                                                className="w-full bg-gray-700 border border-green-500/30 rounded-lg px-2 py-1 text-xs text-white"
                                                            >
                                                                {[0, 1, 2, 3].map(i => <option key={i} value={i}>অপশন {i + 1}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500">ক্যাটাগরি</label>
                                                            <select
                                                                value={editingQ.category}
                                                                onChange={e => setEditingQ({ ...editingQ, category: e.target.value })}
                                                                className="w-full bg-gray-700 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                                                            >
                                                                {['quran', 'seerah', 'fiqh', 'hadith', 'general', 'boss'].map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500">ডিফিকাল্টি</label>
                                                            <select
                                                                value={editingQ.difficulty}
                                                                onChange={e => setEditingQ({ ...editingQ, difficulty: e.target.value })}
                                                                className="w-full bg-gray-700 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                                                            >
                                                                {['easy', 'medium', 'hard', 'boss'].map(d => <option key={d} value={d}>{d}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <textarea
                                                            value={editingQ.explanationBn || ''}
                                                            onChange={e => setEditingQ({ ...editingQ, explanationBn: e.target.value })}
                                                            rows={2}
                                                            className="bg-gray-700 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full"
                                                            placeholder="ব্যাখ্যা (বাংলা)..."
                                                        />
                                                        <textarea
                                                            value={editingQ.explanationEn || ''}
                                                            onChange={e => setEditingQ({ ...editingQ, explanationEn: e.target.value })}
                                                            rows={2}
                                                            className="bg-gray-700 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none w-full"
                                                            placeholder="Explanation (EN)..."
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={saveEditQuestion} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition">✅ সেভ</button>
                                                        <button onClick={() => setEditingQ(null)} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition">বাদ দিন</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* View mode */
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{q.category}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${q.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' : q.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' : q.difficulty === 'boss' ? 'bg-orange-500/20 text-orange-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{q.difficulty}</span>
                                                            <span className="text-[10px] text-gray-600">#{q.id}</span>
                                                        </div>
                                                        <p className="text-sm text-white font-medium leading-snug">{q.questionBn}</p>
                                                        {q.questionEn && <p className="text-xs text-gray-500 mt-0.5">{q.questionEn}</p>}
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {(q.optionsBn as string[])?.map((opt, i) => (
                                                                <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${i === q.correctIndex ? 'bg-green-500/15 text-green-300 border-green-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                                                    {['ক', 'খ', 'গ', 'ঘ'][i]}) {opt}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                                                        <button
                                                            onClick={() => setEditingQ(q)}
                                                            className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/60 text-blue-300 rounded-lg text-xs transition border border-blue-500/20"
                                                        >
                                                            ✏️ এডিট
                                                        </button>
                                                        <button
                                                            onClick={() => deleteQuestion(q.id)}
                                                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs transition border border-red-500/20"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {quizData?.questions.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            কোনো প্রশ্ন পাওয়া যায়নি।
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
