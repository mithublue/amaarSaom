'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

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
    distribution?: Record<string, number>;
    userLevel?: { level: number, nameKey: string };
}

const LEVEL_COLORS: Record<number, { hex: string, tw: string }> = {
    8: { hex: '#be185d', tw: 'bg-pink-700' },     // Mukhlis
    7: { hex: '#7e22ce', tw: 'bg-purple-700' },   // Muhsin
    6: { hex: '#4338ca', tw: 'bg-indigo-700' },   // Mufawwid
    5: { hex: '#1d4ed8', tw: 'bg-blue-700' },     // Mustaqim
    4: { hex: '#0f766e', tw: 'bg-teal-700' },     // Jaad
    3: { hex: '#15803d', tw: 'bg-green-700' },    // Salik
    2: { hex: '#ca8a04', tw: 'bg-yellow-600' },   // Muhib
    1: { hex: '#b45309', tw: 'bg-orange-700' },   // Niyyah
};

export default function LeaderboardClient() {
    const gT = useTranslations('Gamification');
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'overall'>('weekly');
    const [scope, setScope] = useState<'global' | 'district' | 'division' | 'district_ranking' | 'hall_of_fame'>('global');

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
                            <div className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-500 shadow-glass ${data?.userRank?.userId === entry.userId
                                ? 'border-accent-400 scale-110 shadow-gold-glow animate-pulse'
                                : 'border-white/20 group-hover:scale-110 group-hover:border-accent-400'}`}>
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
                        <div className={`font-bold text-xl mb-1 drop-shadow-md text-center transition-colors ${data?.userRank?.userId === entry.userId ? 'text-accent-300' : 'text-white group-hover:text-accent-300'}`}>{entry.userName}</div>
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
                    {(['global', 'division', 'district', 'district_ranking', 'hall_of_fame'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setScope(s)}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${scope === s
                                ? 'bg-accent-600 text-white shadow-gold-glow transform scale-[1.03]'
                                : 'text-primary-300 hover:text-white'
                                }`}
                        >
                            {s === 'district_ranking' ? '🏙️ Districts' : s === 'hall_of_fame' ? `🏆 ${gT('hallOfFame')}` : s.charAt(0).toUpperCase() + s.slice(1)}
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
                    {/* Hall Of Fame View */}
                    {scope === 'hall_of_fame' && data?.distribution ? (
                        <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg p-6 md:p-10 border border-white/10 shadow-glass animate-fade-in relative overflow-hidden">
                            <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-500/20 blur-[100px] rounded-full pointer-events-none" />
                            <div className="text-center mb-10 relative z-10">
                                <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg mb-2 flex items-center justify-center gap-3">
                                    🏆 {gT('hallOfFame')}
                                </h2>
                                <p className="text-primary-300 text-lg">{gT('communityProgress')}</p>
                            </div>

                            {/* CSS Conic Gradient Pie Chart generator */}
                            {(() => {
                                const total = data.distribution.totalUsers || 1;
                                let currentPercentage = 0;
                                const gradientStops = [8, 7, 6, 5, 4, 3, 2, 1]
                                    .map(level => {
                                        const count = data.distribution![level.toString()] || 0;
                                        const percentage = (count / total) * 100;
                                        if (percentage === 0) return null;
                                        const start = currentPercentage;
                                        currentPercentage += percentage;
                                        return `${LEVEL_COLORS[level].hex} ${start}% ${currentPercentage}%`;
                                    })
                                    .filter(Boolean);

                                const conicGradient = gradientStops.length > 0
                                    ? `conic-gradient(${gradientStops.join(', ')})`
                                    : 'conic-gradient(#1e293b 0% 100%)';

                                return (
                                    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 relative z-10 mb-8">
                                        {/* Donut Chart */}
                                        <div className="relative w-64 h-64 md:w-80 md:h-80 shrink-0 select-none">
                                            <div
                                                className="w-full h-full rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] transform -rotate-90 transition-transform duration-1000 animate-fade-in"
                                                style={{ background: conicGradient }}
                                            ></div>
                                            {/* Inner circle for donut look */}
                                            <div className="absolute inset-[15%] rounded-full bg-primary-900/90 backdrop-blur-md shadow-inner flex flex-col items-center justify-center border border-white/5">
                                                <div className="text-4xl md:text-5xl font-black text-white drop-shadow-md">{data.distribution.totalUsers}</div>
                                                <div className="text-[10px] md:text-xs text-primary-400 font-bold uppercase tracking-widest mt-1">Total Users</div>
                                            </div>
                                        </div>

                                        {/* Legend & Stats Matrix */}
                                        <div className="w-full max-w-lg">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {[8, 7, 6, 5, 4, 3, 2, 1].map((level) => {
                                                    const count = data.distribution![level.toString()] || 0;
                                                    const percentage = (count / total) * 100;
                                                    const isMyLevel = data.userLevel?.level === level;

                                                    return (
                                                        <div
                                                            key={level}
                                                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden ${isMyLevel ? 'bg-accent-950/40 border-accent-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] transform scale-[1.02] z-10' : 'bg-primary-950/40 border-white/5 hover:border-white/10'}`}
                                                        >
                                                            {isMyLevel && (
                                                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-accent-500/20 to-transparent pointer-events-none" />
                                                            )}

                                                            {/* Color Dot */}
                                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm ${LEVEL_COLORS[level].tw}`} />

                                                            <div className="flex-1 min-w-0">
                                                                <div className={`font-bold text-sm truncate ${isMyLevel ? 'text-accent-400' : 'text-primary-100'}`}>
                                                                    L{level}: {gT(`levels.${level}`)}
                                                                </div>
                                                                <div className="text-[10px] text-primary-400 font-medium">
                                                                    {count} users
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <div className={`font-black tracking-tight ${isMyLevel ? 'text-accent-400 text-lg' : 'text-white'}`}>
                                                                    {percentage.toFixed(1)}%
                                                                </div>
                                                                {isMyLevel && (
                                                                    <div className="text-[9px] bg-accent-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-widest mt-0.5 inline-block">You</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <>
                            {/* Top 3 Podium */}
                            {data && data.entries?.length > 0 && <TopThree entries={data.entries} />}

                            {/* User Rank Card (Always Sticky at the top when scrolling) */}
                            {data?.userRank && (
                                <div className="sticky top-[90px] z-30 mb-8 bg-linear-to-r from-accent-600/90 to-primary-800/90 backdrop-blur-xl rounded-app-lg p-5 shadow-[0_0_30px_rgba(234,179,8,0.3)] border border-accent-400/50 transform hover:scale-[1.01] transition-all group overflow-hidden">
                                    <div className="absolute inset-0 bg-accent-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="text-3xl font-heading font-black text-white/50 w-12 drop-shadow-sm">#{data.userRank.rank}</div>
                                        <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-accent-400 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-gold-glow">
                                            {data.userRank.userImage ? <img src={data.userRank.userImage} className="w-full h-full object-cover" /> : (scope === 'district_ranking' ? '🏙️' : data.userRank.userName[0])}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-black text-2xl tracking-tight leading-none mb-1 flex items-center gap-2">
                                                {scope === 'district_ranking' ? 'Your District' : 'You'}
                                                <span className="text-[10px] bg-white text-accent-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Global Rank</span>
                                            </div>
                                            <div className="text-white/80 text-sm font-medium uppercase tracking-widest opacity-90 drop-shadow-sm">
                                                {scope === 'district_ranking' ? data.userRank.userName : (data.userRank.location || 'Global')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white font-black text-3xl tabular-nums leading-none mb-1 drop-shadow-md">{data.userRank.totalPoints}</div>
                                            <div className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Points</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Leaderboard List */}
                            <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass overflow-hidden divide-y divide-white/5 mb-20 animate-fade-in relative">
                                {data?.entries.slice(3).map((entry) => {
                                    const isMe = data?.userRank?.userId === entry.userId;
                                    return (
                                        <div
                                            key={entry.userId}
                                            className={`flex items-center gap-5 p-5 transition-all duration-300 group ${isMe
                                                ? 'bg-accent-600/30 border-l-4 border-accent-400 z-10 relative shadow-[0_0_25px_rgba(234,179,8,0.2)]'
                                                : 'hover:bg-white/5 border-l-4 border-transparent'}`}
                                        >
                                            <div className={`text-2xl font-black w-10 text-center tracking-tighter group-hover:scale-110 transition-all ${isMe ? 'text-accent-400' : 'text-primary-500/50 group-hover:text-accent-400'}`}>{entry.rank}</div>

                                            <div className={`w-12 h-12 rounded-full bg-primary-800/40 flex items-center justify-center text-white font-bold overflow-hidden border transition-all ${isMe ? 'border-accent-500 shadow-gold-glow scale-110' : 'border-white/10 shadow-inner group-hover:border-accent-500/30'}`}>
                                                {entry.userImage ? <img src={entry.userImage} className="w-full h-full object-cover" /> : (scope === 'district_ranking' ? '🏙️' : entry.userName[0])}
                                            </div>

                                            <div className="flex-1">
                                                <div className={`font-bold text-lg leading-none mb-1 transition-colors tracking-tight flex items-center gap-2 ${isMe ? 'text-accent-300' : 'text-white group-hover:text-accent-300'}`}>
                                                    {entry.userName}
                                                    {isMe && <span className="text-[10px] bg-accent-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">You</span>}
                                                </div>
                                                {entry.location && <div className="text-primary-400 text-xs font-medium opacity-80 uppercase tracking-wider">{entry.location}</div>}
                                            </div>

                                            <div className="text-right">
                                                <div className={`font-black text-xl tabular-nums transition-colors ${isMe ? 'text-accent-400' : 'text-white group-hover:text-accent-400'}`}>{entry.totalPoints}</div>
                                                <div className="text-[10px] text-primary-500 font-bold uppercase tracking-tighter">Points</div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {data?.entries?.length === 0 && (
                                    <div className="text-center py-20 px-4">
                                        <div className="text-6xl mb-6 opacity-20"></div>
                                        <p className="text-primary-300 text-lg font-medium opacity-60">
                                            No one has earned points in this period yet. <br />
                                            <span className="text-accent-400 font-bold underline cursor-pointer hover:text-accent-300">Be the first to lead!</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
