'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Brain, Sparkles } from 'lucide-react';

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

interface QuizLeaderboardData {
    entries: LeaderboardEntry[];
    userRank?: LeaderboardEntry | null;
    totalEntries: number;
    period: string;
    hijriMonth: string | null;
    userProfile?: {
        currentStreak: number;
        maxStreak: number;
        seasonQuizPoints: number;
        totalQuizPoints: number;
        currentHijriMonth: string | null;
    } | null;
}

const LEVEL_COLORS: Record<number, { hex: string, tw: string }> = {
    8: { hex: '#be185d', tw: 'bg-pink-700' },
    7: { hex: '#7e22ce', tw: 'bg-purple-700' },
    6: { hex: '#4338ca', tw: 'bg-indigo-700' },
    5: { hex: '#1d4ed8', tw: 'bg-blue-700' },
    4: { hex: '#0f766e', tw: 'bg-teal-700' },
    3: { hex: '#15803d', tw: 'bg-green-700' },
    2: { hex: '#ca8a04', tw: 'bg-yellow-600' },
    1: { hex: '#b45309', tw: 'bg-orange-700' },
};

export default function LeaderboardClient() {
    const gT = useTranslations('Gamification');
    const locale = useLocale();
    const isBn = locale === 'bn';

    const [featureTab, setFeatureTab] = useState<'deeds' | 'quiz'>('deeds');

    // Deeds state
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'overall'>('overall');
    const [scope, setScope] = useState<'global' | 'district' | 'division' | 'district_ranking' | 'hall_of_fame'>('global');

    // Quiz state
    const [quizData, setQuizData] = useState<QuizLeaderboardData | null>(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizPeriod, setQuizPeriod] = useState<'season' | 'overall'>('season');
    const [quizScope, setQuizScope] = useState<'global' | 'district'>('global');

    useEffect(() => {
        if (featureTab === 'deeds') fetchLeaderboard();
        else fetchQuizLeaderboard();
    }, [featureTab, period, scope, quizPeriod, quizScope]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leaderboard?${new URLSearchParams({ period, scope })}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchQuizLeaderboard = async () => {
        setQuizLoading(true);
        try {
            const res = await fetch(`/api/quiz/leaderboard?${new URLSearchParams({ period: quizPeriod, scope: quizScope })}`);
            const json = await res.json();
            if (json.success) setQuizData(json.data);
        } catch (e) { console.error(e); } finally { setQuizLoading(false); }
    };

    // ─── Shared Podium ────────────────────────────────────────

    const TopThree = ({ entries, userRankId }: { entries: LeaderboardEntry[]; userRankId?: number }) => {
        const [first, second, third] = [
            entries.find(e => e.rank === 1),
            entries.find(e => e.rank === 2),
            entries.find(e => e.rank === 3),
        ];
        const PodiumItem = ({ entry, color, height, icon }: { entry?: LeaderboardEntry, color: string, height: string, icon: string }) => (
            <div className="flex flex-col items-center justify-end animate-slide-up group">
                {entry ? (
                    <>
                        <div className="relative mb-4">
                            <div className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-500 shadow-glass ${userRankId === entry.userId ? 'border-accent-400 scale-110 shadow-gold-glow animate-pulse' : 'border-white/20 group-hover:scale-110 group-hover:border-accent-400'}`}>
                                {entry.userImage ? <img src={entry.userImage} alt={entry.userName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-linear-to-br from-primary-800 to-primary-600 flex items-center justify-center text-3xl font-bold text-white uppercase">{entry.userName.charAt(0)}</div>}
                            </div>
                            <div className="absolute -top-4 -right-4 text-4xl drop-shadow-xl animate-float">{icon}</div>
                        </div>
                        <div className={`font-bold text-xl mb-1 drop-shadow-md text-center transition-colors ${userRankId === entry.userId ? 'text-accent-300' : 'text-white group-hover:text-accent-300'}`}>{entry.userName}</div>
                        <div className="text-accent-400 text-lg font-bold mb-4 drop-shadow-sm">{entry.totalPoints} <span className="text-xs uppercase tracking-widest text-primary-300">pts</span></div>
                    </>
                ) : <div className="h-32 w-20 mb-4 bg-white/5 rounded-full blur-sm" />}
                <div className={`w-28 ${height} ${color} rounded-t-3xl shadow-glass flex items-end justify-center pb-6 border-t border-x border-white/10 relative overflow-hidden group/podium`}>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/podium:opacity-100 transition-opacity duration-700" />
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

    // ─── Shared List ──────────────────────────────────────────

    const EntriesList = ({ entries, myId, emptyMsg }: { entries: LeaderboardEntry[]; myId?: number; emptyMsg?: string }) => (
        <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass overflow-hidden divide-y divide-white/5 mb-20 animate-fade-in">
            {entries.slice(3).map((entry) => {
                const isMe = myId === entry.userId;
                return (
                    <div key={entry.userId} className={`flex items-center gap-5 p-5 transition-all group ${isMe ? 'bg-accent-600/30 border-l-4 border-accent-400 z-10 relative shadow-[0_0_25px_rgba(234,179,8,0.2)]' : 'hover:bg-white/5 border-l-4 border-transparent'}`}>
                        <div className={`text-2xl font-black w-10 text-center tracking-tighter group-hover:scale-110 transition-all ${isMe ? 'text-accent-400' : 'text-primary-500/50 group-hover:text-accent-400'}`}>{entry.rank}</div>
                        <div className={`w-12 h-12 rounded-full bg-primary-800/40 flex items-center justify-center text-white font-bold overflow-hidden border transition-all ${isMe ? 'border-accent-500 shadow-gold-glow scale-110' : 'border-white/10 shadow-inner group-hover:border-accent-500/30'}`}>
                            {entry.userImage ? <img src={entry.userImage} className="w-full h-full object-cover" /> : entry.userName[0]}
                        </div>
                        <div className="flex-1">
                            <div className={`font-bold text-lg leading-none mb-1 tracking-tight flex items-center gap-2 ${isMe ? 'text-accent-300' : 'text-white group-hover:text-accent-300'}`}>
                                {entry.userName}
                                {isMe && <span className="text-[10px] bg-accent-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">You</span>}
                            </div>
                            {entry.location && <div className="text-primary-400 text-xs font-medium opacity-80 uppercase tracking-wider">{entry.location}</div>}
                        </div>
                        <div className="text-right">
                            <div className={`font-black text-xl tabular-nums ${isMe ? 'text-accent-400' : 'text-white group-hover:text-accent-400'}`}>{entry.totalPoints}</div>
                            <div className="text-[10px] text-primary-500 font-bold uppercase tracking-tighter">pts</div>
                        </div>
                    </div>
                );
            })}
            {entries.length === 0 && (
                <div className="text-center py-20 px-4">
                    <div className="text-6xl mb-6 opacity-20">🧠</div>
                    <p className="text-primary-300 text-lg font-medium opacity-60">{emptyMsg || 'No entries yet.'}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto">
            {/* Feature Tab */}
            <div className="flex gap-2 bg-primary-900/40 border border-white/10 rounded-2xl p-1.5 mb-8">
                <button
                    onClick={() => setFeatureTab('deeds')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${featureTab === 'deeds' ? 'bg-accent-600 text-black shadow-gold-glow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Sparkles className="w-4 h-4" />
                    {isBn ? 'নেক আমল বোর্ড' : 'Good Deeds Board'}
                </button>
                <button
                    onClick={() => setFeatureTab('quiz')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${featureTab === 'quiz' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Brain className="w-4 h-4" />
                    {isBn ? 'কুইজ মাস্টার্স' : 'Quiz Masters'} 🧠
                </button>
            </div>

            {/* ── DEEDS ── */}
            {featureTab === 'deeds' && (
                <>
                    <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg p-2 flex flex-col lg:flex-row justify-between gap-4 mb-12 border border-white/10 shadow-glass">
                        <div className="flex bg-primary-950/60 rounded-xl p-1.5 flex-1">
                            {(['daily', 'weekly', 'overall'] as const).map((p) => (
                                <button key={p} onClick={() => setPeriod(p)} className={`flex-1 px-8 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${period === p ? 'bg-white text-primary-900 shadow-gold-glow transform scale-[1.03]' : 'text-primary-300 hover:text-white'}`}>
                                    {p === 'daily' ? 'Today' : p === 'weekly' ? 'This Week' : 'All Time'}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-primary-950/60 rounded-xl p-1.5 flex-1">
                            {(['global', 'division', 'district', 'district_ranking', 'hall_of_fame'] as const).map((s) => (
                                <button key={s} onClick={() => setScope(s)} className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${scope === s ? 'bg-accent-600 text-white shadow-gold-glow transform scale-[1.03]' : 'text-primary-300 hover:text-white'}`}>
                                    {s === 'district_ranking' ? '🏙️ Districts' : s === 'hall_of_fame' ? `🏆 ${gT('hallOfFame')}` : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading && !data ? (
                        <div className="text-center py-24"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-500 border-t-transparent" /></div>
                    ) : (
                        <>
                            {scope === 'hall_of_fame' && data?.distribution ? (
                                <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg p-6 md:p-10 border border-white/10 shadow-glass animate-fade-in relative overflow-hidden">
                                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-500/20 blur-[100px] rounded-full pointer-events-none" />
                                    <div className="text-center mb-10 relative z-10">
                                        <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg mb-2 flex items-center justify-center gap-3">🏆 {gT('hallOfFame')}</h2>
                                        <p className="text-primary-300 text-lg">{gT('communityProgress')}</p>
                                    </div>
                                    {(() => {
                                        const total = data.distribution.totalUsers || 1;
                                        let cur = 0;
                                        const stops = [8, 7, 6, 5, 4, 3, 2, 1].map(l => {
                                            const c = data.distribution![l.toString()] || 0;
                                            const p = (c / total) * 100;
                                            if (p === 0) return null;
                                            const s = cur; cur += p;
                                            return `${LEVEL_COLORS[l].hex} ${s}% ${cur}%`;
                                        }).filter(Boolean);
                                        const cg = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#1e293b 0% 100%)';
                                        return (
                                            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 relative z-10 mb-8">
                                                <div className="relative w-64 h-64 md:w-80 md:h-80 shrink-0 select-none">
                                                    <div className="w-full h-full rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] transform -rotate-90 animate-fade-in" style={{ background: cg }} />
                                                    <div className="absolute inset-[15%] rounded-full bg-primary-900/90 backdrop-blur-md shadow-inner flex flex-col items-center justify-center border border-white/5">
                                                        <div className="text-4xl md:text-5xl font-black text-white">{data.distribution.totalUsers}</div>
                                                        <div className="text-[10px] md:text-xs text-primary-400 font-bold uppercase tracking-widest mt-1">Total Users</div>
                                                    </div>
                                                </div>
                                                <div className="w-full max-w-lg">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {[8, 7, 6, 5, 4, 3, 2, 1].map(level => {
                                                            const count = data.distribution![level.toString()] || 0;
                                                            const pct = (count / total) * 100;
                                                            const isMe = data.userLevel?.level === level;
                                                            return (
                                                                <div key={level} className={`p-3 rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden ${isMe ? 'bg-accent-950/40 border-accent-500/50 transform scale-[1.02] z-10' : 'bg-primary-950/40 border-white/5 hover:border-white/10'}`}>
                                                                    {isMe && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-accent-500/20 to-transparent pointer-events-none" />}
                                                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${LEVEL_COLORS[level].tw}`} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`font-bold text-sm truncate ${isMe ? 'text-accent-400' : 'text-primary-100'}`}>L{level}: {gT(`levels.${level}`)}</div>
                                                                        <div className="text-[10px] text-primary-400 font-medium">{count} users</div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className={`font-black tracking-tight ${isMe ? 'text-accent-400 text-lg' : 'text-white'}`}>{pct.toFixed(1)}%</div>
                                                                        {isMe && <div className="text-[9px] bg-accent-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-widest mt-0.5 inline-block">You</div>}
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
                                    {data && data.entries?.length > 0 && <TopThree entries={data.entries} userRankId={data.userRank?.userId} />}
                                    {data?.userRank && (
                                        <div className="sticky top-[90px] z-30 mb-8 bg-linear-to-r from-accent-600/90 to-primary-800/90 backdrop-blur-xl rounded-app-lg p-5 shadow-[0_0_30px_rgba(234,179,8,0.3)] border border-accent-400/50 hover:scale-[1.01] transition-all group overflow-hidden">
                                            <div className="absolute inset-0 bg-accent-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
                                                    <div className="text-white/80 text-sm font-medium uppercase tracking-widest opacity-90">
                                                        {scope === 'district_ranking' ? data.userRank.userName : (data.userRank.location || 'Global')}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-white font-black text-3xl tabular-nums leading-none mb-1">{data.userRank.totalPoints}</div>
                                                    <div className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Points</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <EntriesList entries={data?.entries || []} myId={data?.userRank?.userId} emptyMsg="No one has earned points in this period yet. Be the first to lead!" />
                                </>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ── QUIZ ── */}
            {featureTab === 'quiz' && (
                <>
                    {/* Quiz header banner */}
                    <div className="relative mb-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-3xl p-5 overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Brain className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-white font-black text-xl">{isBn ? 'কুইজ মাস্টার্স' : 'Quiz Masters'}</h2>
                                </div>
                                <p className="text-gray-400 text-xs">{quizData?.hijriMonth ? `📅 ${quizData.hijriMonth}` : (isBn ? 'সর্বকালীন র‍্যাংকিং' : 'All-time ranking')}</p>
                            </div>
                            {quizData?.userProfile && (
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-orange-400 font-black text-lg">🔥 {quizData.userProfile.currentStreak}</p>
                                        <p className="text-gray-500 text-[10px]">{isBn ? 'স্ট্রিক' : 'streak'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-accent-400 font-black text-lg">{quizData.userProfile.seasonQuizPoints.toLocaleString()}</p>
                                        <p className="text-gray-500 text-[10px]">{isBn ? 'সিজন পয়েন্ট' : 'season pts'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quiz controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                        <div className="flex gap-1 bg-primary-900/50 border border-white/5 rounded-xl p-1 flex-1">
                            {(['season', 'overall'] as const).map(p => (
                                <button key={p} onClick={() => setQuizPeriod(p)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${quizPeriod === p ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                    {p === 'season' ? (isBn ? 'এই সিজন' : 'This Season') : (isBn ? 'সর্বকালীন' : 'All Time')}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1 bg-primary-900/50 border border-white/5 rounded-xl p-1 flex-1">
                            {(['global', 'district'] as const).map(s => (
                                <button key={s} onClick={() => setQuizScope(s)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${quizScope === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                    {s === 'global' ? (isBn ? 'বৈশ্বিক' : 'Global') : (isBn ? 'জেলা' : 'District')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {quizLoading && !quizData ? (
                        <div className="text-center py-24"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" /></div>
                    ) : (
                        <>
                            {quizData && quizData.entries.length > 0 && <TopThree entries={quizData.entries} userRankId={quizData.userRank?.userId} />}

                            {quizData?.userRank && (
                                <div className="sticky top-[90px] z-30 mb-8 bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-xl rounded-app-lg p-5 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400/40 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="text-3xl font-black text-white/50 w-12">#{quizData.userRank.rank}</div>
                                        <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-blue-400 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                                            {quizData.userRank.userImage ? <img src={quizData.userRank.userImage} className="w-full h-full object-cover" /> : quizData.userRank.userName[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-black text-xl flex items-center gap-2">
                                                {isBn ? 'আপনি' : 'You'}
                                                <span className="text-[10px] bg-white text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">Quiz Rank</span>
                                            </div>
                                            <div className="text-blue-200/70 text-xs">{quizData.userRank.location}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white font-black text-3xl tabular-nums">{quizData.userRank.totalPoints}</div>
                                            <div className="text-[10px] text-blue-200/60 font-bold uppercase">pts</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <EntriesList
                                entries={quizData?.entries || []}
                                myId={quizData?.userRank?.userId}
                                emptyMsg={isBn ? 'এখনো কেউ কুইজ খেলেনি। প্রথম হন!' : 'No quiz entries yet. Play the daily quiz to appear here!'}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
