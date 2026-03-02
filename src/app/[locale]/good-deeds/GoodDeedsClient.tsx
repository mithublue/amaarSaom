'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
    Search,
    Filter,
    ChevronRight,
    PanelRight,
    Trophy,
    X,
    Trash2,
    CheckCircle2,
    Sparkles,
    Clock,
    LayoutGrid,
    History,
    Calendar,
    Flame
} from 'lucide-react';

interface PredefinedDeed {
    id: number;
    name: string;
    description: string | null;
    points: number;
    tier: 'easy' | 'medium' | 'hard';
    category: string | null;
}

interface CompletedDeed {
    id: number;
    completedAt: string;
    totalPoints: number;
    predefinedGoodDeed?: {
        nameEn: string;
        nameBn?: string | null;
        nameAr?: string | null;
        points: number;
    };
    customDeedName?: string | null;
    notes?: string | null;
}

export default function GoodDeedsClient() {
    const t = useTranslations('GoodDeeds');
    const locale = useLocale();
    const [predefinedDeeds, setPredefinedDeeds] = useState<PredefinedDeed[]>([]);
    const [completedDeeds, setCompletedDeeds] = useState<CompletedDeed[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [selectedTier, setSelectedTier] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [customDeedName, setCustomDeedName] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
                const mappedDeeds = data.data.map((deed: any) => {
                    const name = locale === 'bn' ? (deed.nameBn || deed.nameEn) :
                        locale === 'ar' ? (deed.nameAr || deed.nameEn) : deed.nameEn;

                    const description = locale === 'bn' ? (deed.descriptionBn || deed.descriptionEn) :
                        locale === 'ar' ? (deed.descriptionAr || deed.descriptionEn) : deed.descriptionEn;

                    const category = locale === 'bn' ? (deed.categoryBn || deed.categoryEn) :
                        locale === 'ar' ? (deed.categoryAr || deed.categoryEn) : deed.categoryEn;

                    return {
                        ...deed,
                        name: name || '',
                        description: description || '',
                        category: category || deed.category || '',
                    };
                });
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
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error completing deed:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const deleteDeed = async (id: number) => {
        if (!confirm('Are you sure you want to delete this log?')) return;

        try {
            const response = await fetch(`/api/deeds?id=${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                fetchHistory();
            }
        } catch (error) {
            console.error('Error deleting deed:', error);
        }
    };

    const categories = useMemo(() => {
        const cats = Array.from(new Set(predefinedDeeds.map(d => d.category).filter(Boolean)));
        return ['all', ...cats];
    }, [predefinedDeeds]);

    const filteredDeeds = predefinedDeeds.filter(d => {
        const matchesTier = selectedTier === 'all' || d.tier === selectedTier;
        const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
        const matchesSearch = (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTier && matchesCategory && matchesSearch;
    });

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'hard': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
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
        <div className="relative min-h-screen pb-20">
            {/* --- Main Content Area --- */}
            <div className={`max-w-7xl mx-auto px-4 transition-all duration-300 ${isDrawerOpen ? 'mr-[400px]' : ''}`}>

                {/* Large Search Section */}
                <div className="pt-10 pb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
                        {t('title')} <span className="text-accent-400">✨</span>
                    </h1>
                    <p className="text-primary-300 mb-10 max-w-2xl mx-auto">{t('subtitle')}</p>

                    <div className="relative max-w-3xl mx-auto group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-400 group-focus-within:text-accent-400 transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-5 bg-primary-900/50 backdrop-blur-xl text-white text-xl border-2 border-white/5 rounded-full focus:outline-none focus:border-accent-500/50 placeholder-primary-500 transition-all shadow-2xl group-hover:bg-primary-900/70"
                        />
                    </div>
                </div>

                {/* Filters Section */}
                <div className="mb-12 space-y-8">
                    {/* Tier Filters */}
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-primary-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <Filter size={14} /> {t('difficulty')}
                        </span>
                        <div className="flex gap-2 flex-wrap justify-center">
                            {(['all', 'easy', 'medium', 'hard'] as const).map((tier) => (
                                <button
                                    key={tier}
                                    onClick={() => setSelectedTier(tier)}
                                    className={`px-8 py-2.5 rounded-full font-bold transition-all duration-300 text-sm border-2 ${selectedTier === tier
                                        ? 'bg-accent-600 border-accent-400 text-white shadow-gold-glow scale-105'
                                        : 'bg-primary-900/40 border-white/5 text-primary-300 hover:bg-white/10'
                                        }`}
                                >
                                    {getTierEmoji(tier)} {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-primary-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid size={14} /> {t('categories')}
                        </span>
                        <div className="flex gap-2 flex-wrap justify-center max-w-4xl">
                            {categories.filter(c => c !== null).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat!)}
                                    className={`px-5 py-2 rounded-xl font-medium transition-all text-xs border ${selectedCategory === cat
                                        ? 'bg-white text-primary-900 border-white shadow-lg'
                                        : 'bg-primary-800/40 text-primary-400 border-white/5 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Deeds Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-primary-400 font-medium animate-pulse">Fetching deeds...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Custom Deed Card */}
                        <div
                            className={`bg-primary-900/30 backdrop-blur-md rounded-3xl border-2 border-dashed border-white/10 p-6 flex flex-col items-center justify-center text-center hover:bg-primary-800/40 hover:border-accent-500/30 transition-all group min-h-[220px] cursor-pointer ${showCustomForm ? 'ring-2 ring-accent-500/50' : ''}`}
                            onClick={() => setShowCustomForm(!showCustomForm)}
                        >
                            {!showCustomForm ? (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">➕</div>
                                    <h3 className="text-white font-bold text-lg mb-1">{t('customDeed')}</h3>
                                    <p className="text-primary-400 text-sm">Add your own good deed</p>
                                </>
                            ) : (
                                <div className="w-full space-y-3" onClick={e => e.stopPropagation()}>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder={t('customDeedPlaceholder')}
                                        value={customDeedName}
                                        onChange={e => setCustomDeedName(e.target.value)}
                                        className="w-full bg-primary-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-500"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => completeDeed(undefined, customDeedName)}
                                            disabled={!customDeedName || submitting}
                                            className="flex-1 bg-accent-600 text-white rounded-xl py-2 font-bold text-sm shadow-lg hover:bg-accent-500 transition text-balance"
                                        >
                                            {submitting ? '...' : 'Add'}
                                        </button>
                                        <button
                                            onClick={() => setShowCustomForm(false)}
                                            className="bg-white/10 text-white rounded-xl px-3 py-2 hover:bg-white/20"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {filteredDeeds.map((deed) => (
                            <div
                                key={deed.id}
                                className="bg-primary-900/40 backdrop-blur-md rounded-3xl border border-white/10 p-6 hover:shadow-2xl hover:bg-primary-800/60 transition-all duration-300 group flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${getTierColor(deed.tier)}`}>
                                        {deed.tier}
                                    </div>
                                    <div className="text-accent-400 font-bold flex items-center gap-1 bg-accent-500/10 px-2 py-1 rounded-lg border border-accent-500/20">
                                        +{deed.points}
                                    </div>
                                </div>
                                <h3 className="text-white font-bold text-xl mb-2 group-hover:text-accent-300 transition-colors">
                                    {deed.name}
                                </h3>
                                {deed.description && (
                                    <p className="text-primary-300 text-sm mb-4 line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity flex-1">
                                        {deed.description}
                                    </p>
                                )}
                                <div className="mt-auto pt-4 flex items-center justify-between">
                                    {deed.category && (
                                        <span className="text-[10px] text-primary-500 font-bold uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                            {deed.category}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => completeDeed(deed.id)}
                                        disabled={submitting}
                                        className="p-2.5 bg-accent-600 text-white rounded-2xl hover:bg-accent-500 transition-all shadow-gold-glow-sm group-hover:scale-110 active:scale-95 disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={24} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Side Controls Area --- */}
            <div className="fixed right-6 bottom-24 md:bottom-10 flex flex-col gap-4 z-40">
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="w-16 h-16 bg-accent-600 text-white rounded-full flex items-center justify-center shadow-gold-glow hover:scale-110 transition active:scale-95 group relative"
                >
                    <PanelRight size={28} />
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-primary-950">
                        {completedDeeds.length}
                    </span >
                </button>
                <Link
                    href="/leaderboard"
                    className="w-16 h-16 bg-primary-800 text-accent-400 border border-accent-500/30 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition active:scale-95"
                >
                    <Trophy size={28} />
                </Link>
            </div>

            {/* --- Side Drawer Panel --- */}
            <div
                className={`fixed inset-y-0 right-0 w-full max-w-[400px] bg-primary-950/95 backdrop-blur-2xl border-l border-white/10 z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] transform transition-transform duration-500 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Drawer Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="text-accent-400" /> {t('history')}
                    </h2>
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2 text-primary-400 hover:text-white hover:bg-white/10 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Drawer Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 text-center">
                            <div className="text-accent-400 mb-1"><Sparkles size={20} className="mx-auto" /></div>
                            <div className="text-2xl font-bold text-white leading-none mb-1">{totalPoints}</div>
                            <div className="text-[10px] text-primary-400 uppercase font-bold tracking-widest">{t('totalPoints')}</div>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 text-center">
                            <div className="text-emerald-400 mb-1"><CheckCircle2 size={20} className="mx-auto" /></div>
                            <div className="text-2xl font-bold text-white leading-none mb-1">{completedDeeds.length}</div>
                            <div className="text-[10px] text-primary-400 uppercase font-bold tracking-widest">{t('deedsCompleted')}</div>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 text-center col-span-2">
                            <div className="text-indigo-400 mb-1"><Calendar size={20} className="mx-auto" /></div>
                            <div className="text-lg font-bold text-white mb-0.5">
                                {period === 'today' ? t('today') : period === 'week' ? t('week') : period === 'month' ? t('month') : t('allTime')}
                            </div>
                            <div className="text-[10px] text-primary-400 uppercase font-bold tracking-widest">{t('period')}</div>
                        </div>
                    </div>

                    {/* Drawer Period Selector */}
                    <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
                        {(['today', 'week', 'month', 'all'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${period === p
                                    ? 'bg-accent-600 text-white shadow-lg'
                                    : 'text-primary-400 hover:text-white'
                                    }`}
                            >
                                {p === 'today' ? 'Today' : p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All'}
                            </button>
                        ))}
                    </div>

                    {/* Task Log (History) */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-primary-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} /> Task Log
                        </h3>

                        {completedDeeds.length === 0 ? (
                            <div className="py-10 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <History size={40} className="mx-auto text-primary-700 mb-3" />
                                <p className="text-primary-500 text-sm">No deeds logged yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {completedDeeds.map((deed) => (
                                    <div
                                        key={deed.id}
                                        className="bg-white/5 rounded-2xl border border-white/5 p-4 flex justify-between items-center group relative overflow-hidden"
                                    >
                                        <div className="flex-1 pr-4">
                                            <h4 className="text-white font-semibold text-sm leading-tight mb-1">
                                                {deed.predefinedGoodDeed ? (
                                                    locale === 'bn' ? (deed.predefinedGoodDeed.nameBn || deed.predefinedGoodDeed.nameEn) :
                                                        locale === 'ar' ? (deed.predefinedGoodDeed.nameAr || deed.predefinedGoodDeed.nameEn) :
                                                            deed.predefinedGoodDeed.nameEn
                                                ) : deed.customDeedName}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-accent-400 text-xs font-bold">+{deed.totalPoints} pts</span>
                                                <span className="text-primary-500 text-[10px]">{new Date(deed.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteDeed(deed.id)}
                                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="absolute left-0 inset-y-0 w-1 bg-accent-500 transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-6 border-t border-white/10 bg-primary-950">
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-full bg-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition border border-white/10"
                    >
                        Close Panel
                    </button>
                </div>
            </div>

            {/* Overlay for Drawer */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] animate-fade-in"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Success Notification */}
            {successMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-emerald-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 animate-bounce-in">
                    <CheckCircle2 size={24} /> {successMessage}
                </div >
            )}
        </div>
    );
}
