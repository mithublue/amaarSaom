'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

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

interface DeedsData {
    deeds: CompletedDeed[];
    totalPoints: number;
    period: string;
}

export default function GoodDeedsClient() {
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
                    name: deed.nameEn || deed.name, // Fallback to nameEn
                    description: deed.descriptionEn || deed.description, // Fallback to descriptionEn
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
                setSuccessMessage(data.message);
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
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTier && matchesSearch;
    });

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
            case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/30';
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
                    <h1 className="text-3xl font-bold text-white mb-2">Good Deeds Manager</h1>
                    <p className="text-primary-200">Track and earn rewards for your good deeds</p>
                </div>
                <Link href="/leaderboard" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-orange-500/20 transition flex items-center gap-2">
                    🏆 View Leaderboard
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-accent/20 to-secondary/20 backdrop-blur-md rounded-3xl border border-white/20 p-6 text-center">
                    <span className="text-5xl mb-3 block">🌟</span>
                    <h3 className="text-4xl font-bold text-accent mb-1">{totalPoints}</h3>
                    <p className="text-primary-200">Total Points</p>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-md rounded-3xl border border-white/20 p-6 text-center">
                    <span className="text-5xl mb-3 block">✅</span>
                    <h3 className="text-4xl font-bold text-white mb-1">{completedDeeds.length}</h3>
                    <p className="text-primary-200">Deeds Completed</p>
                </div>
                <div className="bg-gradient-to-br from-secondary/20 to-primary/20 backdrop-blur-md rounded-3xl border border-white/20 p-6 text-center">
                    <span className="text-5xl mb-3 block">🔥</span>
                    <h3 className="text-4xl font-bold text-secondary mb-1">
                        {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
                    </h3>
                    <p className="text-primary-200">Period</p>
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
                            : 'bg-white/10 text-primary-200 hover:bg-white/20'
                            }`}
                    >
                        {p === 'today' ? '📅 Today' : p === 'week' ? '📆 Week' : p === 'month' ? '🗓️ Month' : '♾️ All'}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Available Deeds */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">Available Good Deeds</h2>
                        <button
                            onClick={() => setShowCustomForm(!showCustomForm)}
                            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition"
                        >
                            {showCustomForm ? '❌ Cancel' : '➕ Custom'}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300">🔍</span>
                        <input
                            type="text"
                            placeholder="Search deeds..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-primary-400 focus:outline-none focus:border-accent/50 focus:bg-white/10 transition"
                        />
                    </div>

                    {/* Custom Deed Form */}
                    {showCustomForm && (
                        <div className="mb-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                            <h3 className="text-white font-semibold mb-3">Log Custom Good Deed</h3>
                            <input
                                type="text"
                                value={customDeedName}
                                onChange={(e) => setCustomDeedName(e.target.value)}
                                placeholder="Enter deed name (e.g., Helped a neighbor)"
                                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent mb-3"
                            />
                            <button
                                onClick={() => completeDeed(undefined, customDeedName)}
                                disabled={!customDeedName || submitting}
                                className="w-full px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/80 transition disabled:opacity-50"
                            >
                                {submitting ? 'Logging...' : '✨ Log Custom Deed (+5 points)'}
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
                                    ? 'bg-accent text-white'
                                    : 'bg-white/10 text-primary-200 hover:bg-white/15'
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
                            <p className="text-center text-primary-300 py-8">No deeds found</p>
                        ) : (
                            filteredDeeds.map((deed) => (
                                <div
                                    key={deed.id}
                                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="text-white font-semibold text-lg">{deed.name}</h3>
                                            {deed.description && (
                                                <p className="text-primary-300 text-sm mt-1">{deed.description}</p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getTierColor(deed.tier)}`}>
                                            {getTierEmoji(deed.tier)} +{deed.points}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => completeDeed(deed.id)}
                                        disabled={submitting}
                                        className="w-full mt-3 px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent hover:text-white transition disabled:opacity-50 font-semibold"
                                    >
                                        {submitting ? 'Logging...' : '✨ Complete This Deed'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Completed Deeds History */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Your History ({period})</h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {completedDeeds.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-6xl mb-4 block">📝</span>
                                <p className="text-primary-300">No deeds logged yet!</p>
                                <p className="text-primary-400 text-sm mt-2">Start completing good deeds to earn points</p>
                            </div>
                        ) : (
                            completedDeeds.map((deed) => (
                                <div
                                    key={deed.id}
                                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-white font-semibold">
                                                {deed.predefinedGoodDeed?.name || deed.customDeedName}
                                            </h4>
                                            <p className="text-primary-400 text-sm mt-1">
                                                {new Date(deed.completedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            {deed.notes && (
                                                <p className="text-primary-300 text-sm mt-2 italic">{deed.notes}</p>
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
