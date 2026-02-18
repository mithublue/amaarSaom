'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface PredefinedDeed {
    id: number;
    name: string;
    nameEn?: string;
    description: string | null;
    descriptionEn?: string | null;
    points: number;
    tier: 'easy' | 'medium' | 'hard';
    category: string | null;
}

interface CompletedDeed {
    id: number;
    completedAt: Date;
    totalPoints: number;
    predefinedGoodDeed?: {
        name: string;
        points: number;
    };
    customDeedName?: string | null;
    notes?: string | null;
}

export default function GoodDeedsClient() {
    const t = useTranslations('GoodDeeds');
    const [predefinedDeeds, setPredefinedDeeds] = useState<PredefinedDeed[]>([]);
    const [completedDeeds, setCompletedDeeds] = useState<CompletedDeed[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [selectedTier, setSelectedTier] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [customDeedName, setCustomDeedName] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPredefinedDeeds();
        fetchHistory();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [period]);

    const fetchPredefinedDeeds = async () => {
        try {
            const response = await fetch('/api/deeds/predefined');
            const data = await response.json();
            if (data.success) {
                const mappedDeeds = data.data.map((deed: any) => ({
                    ...deed,
                    name: deed.name || deed.nameEn || '',
                    description: deed.description || deed.descriptionEn || '',
                }));
                setPredefinedDeeds(mappedDeeds);
            }
        } catch (error) {
            console.error('Error fetching predefined deeds:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(`/api/deeds?period=${period}`);
            const data = await response.json();
            if (data.success) {
                setCompletedDeeds(data.data.deeds);
                setTotalPoints(data.data.totalPoints);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const completeDeed = async (goodDeedId?: number, customName?: string) => {
        setSubmitting(true);
        setSuccessMessage('');

        try {
            const response = await fetch('/api/deeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goodDeedId,
                    customDeedName: customName,
                    ramadanDayNumber: new Date().getDate(), // Makeshift day number
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage(t('success'));
                setCustomDeedName('');
                setShowCustomForm(false);
                fetchHistory();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error completing deed:', error);
            alert('Failed to log deed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDeeds = predefinedDeeds.filter(d => {
        const matchesTier = selectedTier === 'all' || d.tier === selectedTier;
        const matchesSearch = (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTier && matchesSearch;
    });

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'easy': return 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30';
            case 'medium': return 'text-amber-300 bg-amber-500/20 border-amber-500/30';
            case 'hard': return 'text-rose-300 bg-rose-500/20 border-rose-500/30';
            default: return 'text-primary-300';
        }
    };

    const getTierEmoji = (tier: string) => {
        switch (tier) {
            case 'easy': return '🌱';
            case 'medium': return '⭐';
            case 'hard': return '💎';
            default: return '✨';
        }
    };

    return (
        <div className="w-full">
            {/* Success Message */}
            {successMessage && (
                <div className="mb-8 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 text-center animate-fade-in backdrop-blur-sm">
                    <p className="text-emerald-200 text-lg font-semibold flex items-center justify-center gap-2">
                        ✅ {successMessage}
                    </p>
                </div>
            )}

            {/* Top Actions Bar */}
            <div className="flex justify-center mb-8">
                <Link href="/leaderboard" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold shadow-gold-glow hover:shadow-lg hover:scale-105 transition flex items-center gap-3">
                    🏆 {t('viewLeaderboard')}
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass p-6 text-center group hover:bg-primary-900/60 transition-all duration-300">
                    <div className="w-16 h-16 mx-auto bg-accent-500/20 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                        🌟
                    </div>
                    <h3 className="text-4xl font-heading font-bold text-accent-400 mb-1 drop-shadow-sm">{totalPoints}</h3>
                    <p className="text-primary-200 font-medium">{t('totalPoints')}</p>
                </div>
                <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass p-6 text-center group hover:bg-primary-900/60 transition-all duration-300">
                    <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                        ✅
                    </div>
                    <h3 className="text-4xl font-heading font-bold text-white mb-1 drop-shadow-sm">{completedDeeds.length}</h3>
                    <p className="text-primary-200 font-medium">{t('deedsCompleted')}</p>
                </div>
                <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass p-6 text-center group hover:bg-primary-900/60 transition-all duration-300">
                    <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                        🔥
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 capitalize">
                        {period === 'today' ? t('today') : period === 'week' ? t('week') : period === 'month' ? t('month') : t('allTime')}
                    </h3>
                    <p className="text-primary-200 font-medium">{t('period')}</p>
                </div>
            </div>

            {/* Period Selector */}
            <div className="mb-8 flex justify-center gap-3 flex-wrap">
                {(['today', 'week', 'month', 'all'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${period === p
                            ? 'bg-accent-600 text-white shadow-gold-glow scale-105'
                            : 'bg-primary-900/40 text-primary-300 border border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {p === 'today' ? t('today') : p === 'week' ? t('week') : p === 'month' ? t('month') : t('allTime')}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Available Deeds */}
                <div className="bg-primary-900/20 backdrop-blur-sm rounded-3xl p-6 border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            ✨ {t('availableDeeds')}
                        </h2>
                        <button
                            onClick={() => setShowCustomForm(!showCustomForm)}
                            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition border border-white/10 text-sm font-medium"
                        >
                            {showCustomForm ? t('cancel') : `+ ${t('customDeed')}`}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400">🔍</span>
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-primary-950/50 border border-white/10 rounded-xl text-white placeholder-primary-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition shadow-inner"
                        />
                    </div>

                    {/* Custom Deed Form */}
                    {showCustomForm && (
                        <div className="mb-6 bg-primary-800/50 rounded-2xl border border-accent-500/30 p-6 animate-fade-in">
                            <h3 className="text-white font-bold mb-3">{t('logCustomDeed')}</h3>
                            <input
                                type="text"
                                value={customDeedName}
                                onChange={(e) => setCustomDeedName(e.target.value)}
                                placeholder={t('customDeedPlaceholder')}
                                className="w-full px-4 py-3 rounded-xl bg-primary-950 text-white border border-white/10 focus:outline-none focus:border-accent-500 mb-4"
                            />
                            <button
                                onClick={() => completeDeed(undefined, customDeedName)}
                                disabled={!customDeedName || submitting}
                                className="w-full px-6 py-3 bg-accent-600 text-white rounded-xl hover:bg-accent-500 transition disabled:opacity-50 font-bold shadow-lg"
                            >
                                {submitting ? t('logging') : t('logButton')}
                            </button>
                        </div>
                    )}

                    {/* Tier Filter */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {(['all', 'easy', 'medium', 'hard'] as const).map((tier) => (
                            <button
                                key={tier}
                                onClick={() => setSelectedTier(tier)}
                                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${selectedTier === tier
                                    ? 'bg-white text-primary-900 shadow-md transform scale-105'
                                    : 'bg-primary-900/40 text-primary-300 border border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {getTierEmoji(tier)} {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Deeds List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-accent-500 border-t-transparent"></div>
                            </div>
                        ) : filteredDeeds.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-primary-400">{t('noDeeds')}</p>
                            </div>
                        ) : (
                            filteredDeeds.map((deed) => (
                                <div
                                    key={deed.id}
                                    className="bg-primary-900/40 backdrop-blur-sm rounded-2xl border border-white/5 p-5 hover:border-accent-500/30 hover:bg-primary-800/40 transition-all duration-300 group shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold text-lg group-hover:text-accent-300 transition-colors">{deed.name}</h3>
                                            {deed.description && (
                                                <p className="text-primary-300 text-sm mt-1">{deed.description}</p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ml-3 whitespace-nowrap ${getTierColor(deed.tier)}`}>
                                            {getTierEmoji(deed.tier)} +{deed.points}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => completeDeed(deed.id)}
                                        disabled={submitting}
                                        className="w-full mt-2 px-4 py-2.5 bg-white/5 text-accent-300 rounded-xl hover:bg-accent-600 hover:text-white transition-all disabled:opacity-50 font-semibold border border-white/5 hover:border-accent-500 group-hover:shadow-gold-glow"
                                    >
                                        {submitting ? t('logging') : t('completeButton')}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Completed Deeds History */}
                <div className="bg-primary-900/20 backdrop-blur-sm rounded-3xl p-6 border border-white/5">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        📜 {t('history')}
                        <span className="text-sm font-normal text-primary-400 ml-auto bg-white/5 px-3 py-1 rounded-full">
                            {period === 'today' ? t('today') : period === 'week' ? t('week') : period === 'month' ? t('month') : t('allTime')}
                        </span>
                    </h2>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {completedDeeds.length === 0 ? (
                            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                <span className="text-6xl mb-4 block opacity-20">📝</span>
                                <p className="text-primary-300 font-medium">{t('noHistory')}</p>
                                <p className="text-primary-500 text-sm mt-2">{t('startCompleting')}</p>
                            </div>
                        ) : (
                            completedDeeds.map((deed) => (
                                <div
                                    key={deed.id}
                                    className="bg-white/5 rounded-2xl border border-white/5 p-4 hover:bg-white/10 transition flex justify-between items-center group"
                                >
                                    <div>
                                        <h4 className="text-white font-semibold flex items-center gap-2">
                                            {deed.predefinedGoodDeed?.name || deed.customDeedName}
                                        </h4>
                                        <p className="text-primary-400 text-xs mt-1">
                                            {new Date(deed.completedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <span className="text-accent-400 font-bold text-lg bg-black/20 px-3 py-1 rounded-lg border border-white/5 group-hover:border-accent-500/30 transition-colors">
                                        +{deed.totalPoints}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
