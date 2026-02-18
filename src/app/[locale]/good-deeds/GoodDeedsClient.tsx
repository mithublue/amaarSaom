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
                console.log('Fetched deeds:', data.data.length);
                // Map the DB fields to the interface
                const mappedDeeds = data.data.map((deed: any) => ({
                    ...deed,
                    // Ideally the API should handle localization or we handle it here if we had the locale.
                    // For now, next-intl suggests fetching data already localized or handling it in render.
                    // Since this is client side, we might need to pass locale to API or just use what we have.
                    // The previous code had nameEn fallback. Let's keep it simple for now.
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
                    ramadanDayNumber: new Date().getDate(),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage(t('success'));
                setCustomDeedName('');
                setShowCustomForm(false);
                fetchHistory();

                // Clear success message after 3 seconds
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
            case 'easy': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'hard': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-primary-600';
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
        <div className="max-w-6xl mx-auto">
            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-2xl p-4 text-center animate-slide-down">
                    <p className="text-green-200 text-lg font-semibold">{successMessage}</p>
                </div>
            )}

            {/* Top Stats & Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
                    <p className="text-primary-200">{t('subtitle')}</p>
                </div>
                <Link href="/leaderboard" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-orange-500/20 transition flex items-center gap-2">
                    {t('viewLeaderboard')}
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                    <span className="text-5xl mb-3 block">🌟</span>
                    <h3 className="text-4xl font-bold text-accent mb-1">{totalPoints}</h3>
                    <p className="text-text-secondary">{t('totalPoints')}</p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                    <span className="text-5xl mb-3 block">✅</span>
                    <h3 className="text-4xl font-bold text-primary-900 mb-1">{completedDeeds.length}</h3>
                    <p className="text-text-secondary">{t('deedsCompleted')}</p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                    <span className="text-5xl mb-3 block">🔥</span>
                    <h3 className="text-4xl font-bold text-secondary mb-1">
                        {period === 'today' ? t('today') : period === 'week' ? t('week') : period === 'month' ? t('month') : t('allTime')}
                    </h3>
                    <p className="text-text-secondary">{t('period')}</p>
                </div>
            </div>

            {/* Period Selector */}
            <div className="mb-6 flex gap-3 flex-wrap">
                {(['today', 'week', 'month', 'all'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-6 py-2 rounded-xl font-semibold transition-all ${period === p
                            ? 'bg-accent text-white shadow-lg scale-105'
                            : 'bg-white border border-gray-200 text-primary-600 hover:bg-slate-50'
                            }`}
                    >
                        {p === 'today' ? t('today') : p === 'week' ? t('week') : p === 'month' ? t('month') : t('allTime')}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Available Deeds */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-primary-900">{t('availableDeeds')}</h2>
                        <button
                            onClick={() => setShowCustomForm(!showCustomForm)}
                            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition shadow-sm"
                        >
                            {showCustomForm ? t('cancel') : t('customDeed')}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-primary-900 placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition shadow-sm"
                        />
                    </div>

                    {/* Custom Deed Form */}
                    {showCustomForm && (
                        <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-primary-900 font-semibold mb-3">{t('logCustomDeed')}</h3>
                            <input
                                type="text"
                                value={customDeedName}
                                onChange={(e) => setCustomDeedName(e.target.value)}
                                placeholder={t('customDeedPlaceholder')}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 text-primary-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent mb-3"
                            />
                            <button
                                onClick={() => completeDeed(undefined, customDeedName)}
                                disabled={!customDeedName || submitting}
                                className="w-full px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/80 transition disabled:opacity-50 font-semibold shadow-md"
                            >
                                {submitting ? t('logging') : t('logButton')}
                            </button>
                        </div>
                    )}

                    {/* Tier Filter */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {(['all', 'easy', 'medium', 'hard'] as const).map((tier) => (
                            <button
                                key={tier}
                                onClick={() => setSelectedTier(tier)}
                                className={`px-4 py-2 rounded-lg font-semibold transition ${selectedTier === tier
                                    ? 'bg-accent text-white shadow-md'
                                    : 'bg-white border border-gray-200 text-primary-600 hover:bg-slate-50'
                                    }`}
                            >
                                {getTierEmoji(tier)} {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Deeds List */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
                            </div>
                        ) : filteredDeeds.length === 0 ? (
                            <p className="text-center text-text-muted py-8">{t('noDeeds')}</p>
                        ) : (
                            filteredDeeds.map((deed) => (
                                <div
                                    key={deed.id}
                                    className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition group shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="text-primary-900 font-semibold text-lg">{deed.name}</h3>
                                            {deed.description && (
                                                <p className="text-text-secondary text-sm mt-1">{deed.description}</p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getTierColor(deed.tier)}`}>
                                            {getTierEmoji(deed.tier)} +{deed.points}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => completeDeed(deed.id)}
                                        disabled={submitting}
                                        className="w-full mt-3 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white transition disabled:opacity-50 font-semibold border border-accent/20"
                                    >
                                        {submitting ? t('logging') : t('completeButton')}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Completed Deeds History */}
                <div>
                    <h2 className="text-2xl font-bold text-primary-900 mb-4">{t('history')} ({period === 'today' ? t('today') : period === 'week' ? t('week') : period === 'month' ? t('month') : t('allTime')})</h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {completedDeeds.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                <span className="text-6xl mb-4 block">📝</span>
                                <p className="text-text-secondary">{t('noHistory')}</p>
                                <p className="text-text-muted text-sm mt-2">{t('startCompleting')}</p>
                            </div>
                        ) : (
                            completedDeeds.map((deed) => (
                                <div
                                    key={deed.id}
                                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-primary-900 font-semibold">
                                                {deed.predefinedGoodDeed?.name || deed.customDeedName}
                                            </h4>
                                            <p className="text-text-muted text-sm mt-1">
                                                {new Date(deed.completedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            {deed.notes && (
                                                <p className="text-text-secondary text-sm mt-2 italic">{deed.notes}</p>
                                            )}
                                        </div>
                                        <span className="text-accent font-bold text-lg">+{deed.totalPoints}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

