'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
    rank: number;
    userId: number;
    userName: string;
    userImage?: string;
    totalPoints: number;
    location?: string;
}

interface LeaderboardData {
    entries: LeaderboardEntry[];
    userRank?: LeaderboardEntry;
    totalUsers: number;
}

export default function LeaderboardClient() {
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'overall'>('daily');
    const [scope, setScope] = useState<'global' | 'district' | 'division' | 'district_ranking'>('global');

    useEffect(() => {
        fetchLeaderboard();
    }, [period, scope]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // For this demo, scopeId is fetched from session on the server, 
            // but here we just pass the scope type. 
            // The API will infer the user's location if scope is not global.
            // NOTE: In a real app, we might pass specific IDs if browsing other locations.
            const queryParams = new URLSearchParams({
                period,
                scope,
                // limit: '50'
            });

            const res = await fetch(`/api/leaderboard?${queryParams}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const TopThree = ({ entries }: { entries: LeaderboardEntry[] }) => {
        const [first, second, third] = [
            entries.find(e => e.rank === 1),
            entries.find(e => e.rank === 2),
            entries.find(e => e.rank === 3)
        ];

        const PodiumItem = ({ entry, color, height, icon }: { entry?: LeaderboardEntry, color: string, height: string, icon: string }) => (
            <div className="flex flex-col items-center justify-end">
                {entry ? (
                    <>
                        <div className="relative mb-2">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                {entry.userImage ? (
                                    <img src={entry.userImage} alt={entry.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-2xl font-bold text-gray-500">
                                        {entry.userName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -top-3 -right-3 text-2xl drop-shadow-md">
                                {icon}
                            </div>
                        </div>
                        <div className="text-white font-bold text-lg mb-1">{entry.userName}</div>
                        <div className="text-accent-200 text-sm font-semibold mb-3">{entry.totalPoints} pts</div>
                    </>
                ) : (
                    <div className="h-24 w-16 mb-2"></div>
                )}

                <div className={`w-24 ${height} ${color} rounded-t-2xl shadow-lg flex items-end justify-center pb-4`}>
                    <span className="text-white/50 font-bold text-4xl">{entry?.rank}</span>
                </div>
            </div>
        );

        return (
            <div className="flex justify-center items-end gap-4 mb-12 min-h-[280px]">
                <PodiumItem entry={second} color="bg-secondary/80" height="h-32" icon="🥈" />
                <PodiumItem entry={first} color="bg-accent" height="h-44" icon="👑" />
                <PodiumItem entry={third} color="bg-secondary-700/80" height="h-24" icon="🥉" />
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Controls */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex flex-col sm:flex-row justify-between gap-2 mb-8 border border-white/10">
                <div className="flex bg-black/20 rounded-xl p-1">
                    {(['daily', 'weekly', 'overall'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 px-6 py-2 rounded-lg font-semibold transition-all ${period === p
                                ? 'bg-accent text-white shadow-lg'
                                : 'text-primary-200 hover:text-white'
                                }`}
                        >
                            {p === 'daily' ? 'Today' : p === 'weekly' ? 'This Week' : 'All Time'}
                        </button>
                    ))}
                </div>

                <div className="flex bg-black/20 rounded-xl p-1">
                    {(['global', 'division', 'district', 'district_ranking'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setScope(s)}
                            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${scope === s
                                ? 'bg-secondary text-white shadow-lg'
                                : 'text-primary-200 hover:text-white'
                                }`}
                        >
                            {s === 'district_ranking' ? '🏙️ Top Districts' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading && !data ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    {data && data.entries.length > 0 && <TopThree entries={data.entries} />}

                    {/* User Rank Card */}
                    {data?.userRank && (
                        <div className="sticky top-4 z-10 mb-6 bg-gradient-to-r from-accent to-secondary rounded-2xl p-4 shadow-xl border border-white/30 transform hover:scale-[1.02] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-white w-8">#{data.userRank.rank}</div>
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                                    {data.userRank.userImage ? <img src={data.userRank.userImage} /> : (scope === 'district_ranking' ? '🏙️' : data.userRank.userName[0])}
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-bold text-lg">
                                        {scope === 'district_ranking' ? 'Your District' : 'You'}
                                    </div>
                                    <div className="text-white/80 text-sm">
                                        {scope === 'district_ranking' ? data.userRank.userName : (data.userRank.location || 'Global')}
                                    </div>
                                </div>
                                <div className="text-white font-bold text-2xl">{data.userRank.totalPoints} pts</div>
                            </div>
                        </div>
                    )}

                    {/* Leaderboard List */}
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        {data?.entries.slice(3).map((entry) => (
                            <div
                                key={entry.userId}
                                className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                                <div className="text-xl font-bold text-primary-300 w-8 text-center">{entry.rank}</div>

                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary-200 font-bold overflow-hidden">
                                    {entry.userImage ? <img src={entry.userImage} className="w-full h-full object-cover" /> : entry.userName[0]}
                                </div>

                                <div className="flex-1">
                                    <div className="text-white font-semibold">
                                        {entry.userName}
                                    </div>
                                    {entry.location && <div className="text-primary-400 text-xs">{entry.location}</div>}
                                </div>

                                <div className="text-accent font-bold text-lg">{entry.totalPoints}</div>
                            </div>
                        ))}

                        {data?.entries.length === 0 && (
                            <div className="text-center py-12 text-primary-300">
                                No one has earned points in this period yet. Be the first! 🚀
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
