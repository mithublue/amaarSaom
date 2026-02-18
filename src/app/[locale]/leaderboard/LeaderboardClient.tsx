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
            <div className="flex flex-col items-center justify-end animate-slide-up group">
                {entry ? (
                    <>
                        <div className="relative mb-4">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 shadow-glass group-hover:scale-110 group-hover:border-accent-400 transition-all duration-500">
                                {entry.userImage ? (
                                    <img src={entry.userImage} alt={entry.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-linear-to-br from-primary-800 to-primary-600 flex items-center justify-center text-3xl font-bold text-white uppercase">
                                        {entry.userName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -top-4 -right-4 text-4xl drop-shadow-xl animate-float">
                                {icon}
                            </div>
                        </div>
                        <div className="text-white font-bold text-xl mb-1 drop-shadow-md text-center group-hover:text-accent-300 transition-colors">{entry.userName}</div>
                        <div className="text-accent-400 text-lg font-bold mb-4 drop-shadow-sm">{entry.totalPoints} <span className="text-xs uppercase tracking-widest text-primary-300">pts</span></div>
                    </>
                ) : (
                    <div className="h-32 w-20 mb-4 bg-white/5 rounded-full blur-sm"></div>
                )}

                <div className={`w-28 ${height} ${color} rounded-t-3xl shadow-glass flex items-end justify-center pb-6 border-t border-x border-white/10 relative overflow-hidden group/podium`}>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/podium:opacity-100 transition-opacity duration-700"></div>
                    <span className="text-white/20 font-heading font-black text-6xl italic relative z-10 select-none">{entry?.rank}</span>
                </div>
            </div>
        );

        return (
            <div className="flex justify-center items-end gap-2 md:gap-8 mb-16 min-h-[340px] px-2">
                <PodiumItem entry={second} color="bg-linear-to-b from-primary-800 to-primary-900" height="h-36" icon="🥈" />
                <PodiumItem entry={first} color="bg-linear-to-b from-accent-600 to-primary-900" height="h-52" icon="👑" />
                <PodiumItem entry={third} color="bg-linear-to-b from-primary-700 to-primary-900" height="h-28" icon="🥉" />
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Controls */}
            <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg p-2 flex flex-col lg:flex-row justify-between gap-4 mb-12 border border-white/10 shadow-glass">
                <div className="flex bg-primary-950/60 rounded-xl p-1.5 flex-1">
                    {(['daily', 'weekly', 'overall'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 px-8 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${period === p
                                ? 'bg-white text-primary-900 shadow-gold-glow transform scale-[1.03]'
                                : 'text-primary-300 hover:text-white'
                                }`}
                        >
                            {p === 'daily' ? 'Today' : p === 'weekly' ? 'This Week' : 'All Time'}
                        </button>
                    ))}
                </div>

                <div className="flex bg-primary-950/60 rounded-xl p-1.5 flex-1">
                    {(['global', 'division', 'district', 'district_ranking'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setScope(s)}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${scope === s
                                ? 'bg-accent-600 text-white shadow-gold-glow transform scale-[1.03]'
                                : 'text-primary-300 hover:text-white'
                                }`}
                        >
                            {s === 'district_ranking' ? '🏙️ Districts' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading && !data ? (
                <div className="text-center py-24">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-500 border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    {data && data.entries.length > 0 && <TopThree entries={data.entries} />}

                    {/* User Rank Card */}
                    {data?.userRank && (
                        <div className="sticky top-[100px] z-20 mb-10 bg-linear-to-r from-accent-600 to-primary-700 rounded-app-lg p-6 shadow-gold-glow border border-white/30 transform hover:scale-[1.01] transition-all group overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="text-3xl font-heading font-black text-white/40 w-12">#{data.userRank.rank}</div>
                                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-sm">
                                    {data.userRank.userImage ? <img src={data.userRank.userImage} className="w-full h-full object-cover" /> : (scope === 'district_ranking' ? '🏙️' : data.userRank.userName[0])}
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-black text-2xl tracking-tight leading-none mb-1">
                                        {scope === 'district_ranking' ? 'Your District' : 'You'}
                                    </div>
                                    <div className="text-white/80 text-sm font-medium uppercase tracking-widest opacity-80">
                                        {scope === 'district_ranking' ? data.userRank.userName : (data.userRank.location || 'Global')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-black text-3xl tabular-nums leading-none mb-1">{data.userRank.totalPoints}</div>
                                    <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Points</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Leaderboard List */}
                    <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass overflow-hidden divide-y divide-white/5 mb-20 animate-fade-in">
                        {data?.entries.slice(3).map((entry) => (
                            <div
                                key={entry.userId}
                                className="flex items-center gap-5 p-5 hover:bg-white/5 transition-all duration-300 group"
                            >
                                <div className="text-2xl font-black text-primary-500/50 w-10 text-center tracking-tighter group-hover:text-accent-400 group-hover:scale-110 transition-all">{entry.rank}</div>

                                <div className="w-12 h-12 rounded-full bg-primary-800/40 flex items-center justify-center text-white font-bold overflow-hidden border border-white/10 shadow-inner group-hover:border-accent-500/30 transition-all">
                                    {entry.userImage ? <img src={entry.userImage} className="w-full h-full object-cover" /> : (scope === 'district_ranking' ? '🏙️' : entry.userName[0])}
                                </div>

                                <div className="flex-1">
                                    <div className="text-white font-bold text-lg leading-none mb-1 group-hover:text-accent-300 transition-colors tracking-tight">
                                        {entry.userName}
                                    </div>
                                    {entry.location && <div className="text-primary-400 text-xs font-medium opacity-80 uppercase tracking-wider">{entry.location}</div>}
                                </div>

                                <div className="text-right">
                                    <div className="text-white font-black text-xl tabular-nums group-hover:text-accent-400 transition-colors">{entry.totalPoints}</div>
                                    <div className="text-[10px] text-primary-500 font-bold uppercase tracking-tighter">Points</div>
                                </div>
                            </div>
                        ))}

                        {data?.entries.length === 0 && (
                            <div className="text-center py-20 px-4">
                                <div className="text-6xl mb-6 opacity-20">🚀</div>
                                <p className="text-primary-300 text-lg font-medium opacity-60">
                                    No one has earned points in this period yet. <br />
                                    <span className="text-accent-400 font-bold underline cursor-pointer hover:text-accent-300">Be the first to lead!</span>
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
