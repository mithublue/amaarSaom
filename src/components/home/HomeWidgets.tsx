'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { resolveAladhanUrl } from '@/lib/location';
import CircularTimer from './CircularTimer';
import { Brain, Flame, Trophy, CheckCircle } from 'lucide-react';

interface PrayerTimes {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
}

interface NearbyUser {
    rank: number;
    userName: string;
    totalPoints: number;
}

interface DeedSuggestion {
    namebn: string;
    href: string;
    time?: 'morning' | 'evening' | 'night' | 'tahajjud' | 'any';
}

const DEED_SUGGESTIONS: DeedSuggestion[] = [
    { namebn: 'সূরা মুলক তিলাওয়াত', href: '/quran', time: 'night' },
    { namebn: '১০০ বার দরুদ পাঠ', href: '/duas', time: 'any' },
    { namebn: 'সকালের যিকর', href: '/duas', time: 'morning' },
    { namebn: 'সন্ধ্যার যিকর', href: '/duas', time: 'evening' },
    { namebn: 'দৈনিক হাদিস পড়া', href: '/hadith', time: 'any' },
    { namebn: 'তাহাজ্জুদ নামাজ', href: '/prayer-times', time: 'tahajjud' },
    { namebn: 'পিতামাতার জন্য দোয়া', href: '/duas', time: 'any' },
    { namebn: '৫ ওয়াক্ত জামাতে নামাজ', href: '/prayer-times', time: 'any' },
    { namebn: 'ইসলামিক বই পড়া', href: '/', time: 'any' },
    { namebn: 'কাউকে হাসিমুখে সালাম দেওয়া', href: '/', time: 'any' },
    { namebn: 'অসহায়কে খাদ্য দান', href: '/zakat', time: 'any' },
    { namebn: 'গাছ লাগানো', href: '/', time: 'any' },
    { namebn: 'পানি পান করানো', href: '/', time: 'any' },
    { namebn: 'ধৈর্য ধারণ করা', href: '/', time: 'any' },
    { namebn: 'একটি ভালো কথা বলা', href: '/', time: 'any' },
    { namebn: 'সুন্নাতে রাসূল (সা.) পালন', href: '/', time: 'any' },
    { namebn: 'তওবা ও ইস্তেগফার করা', href: '/duas', time: 'any' },
    { namebn: 'কুরআনের অর্থ বোঝা', href: '/quran', time: 'any' },
    { namebn: 'প্রতিবেশীর খোঁজ নেওয়া', href: '/', time: 'any' },
];

function toMin(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function formatCountdown(totalSeconds: number): string {
    if (totalSeconds <= 0) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getCurrentWaqtInfo(times: PrayerTimes, nowMin: number): { name: string; endMin: number } {
    const fajr = toMin(times.Fajr);
    const sunrise = toMin(times.Sunrise);
    const dhuhr = toMin(times.Dhuhr);
    const asr = toMin(times.Asr);
    const maghrib = toMin(times.Maghrib);
    const isha = toMin(times.Isha);

    if (nowMin >= isha || nowMin < fajr) {
        const endMin = fajr + (nowMin >= isha ? 24 * 60 : 0);
        return { name: 'এশার ওয়াক্ত', endMin };
    }
    if (nowMin >= maghrib) return { name: 'মাগরিবের ওয়াক্ত', endMin: isha };
    if (nowMin >= asr) return { name: 'আসরের ওয়াক্ত', endMin: maghrib };
    if (nowMin >= dhuhr) return { name: 'জোহরের ওয়াক্ত', endMin: asr };
    if (nowMin >= sunrise) return { name: 'চাশতের সময়', endMin: dhuhr };
    return { name: 'ফজরের ওয়াক্ত', endMin: sunrise };
}

function getIftarSehriInfo(times: PrayerTimes, nowMin: number): { label: string; targetMin: number } {
    const fajr = toMin(times.Fajr);
    const maghrib = toMin(times.Maghrib);
    const sehriStart = fajr - 150;

    if (nowMin >= fajr && nowMin < maghrib) {
        return { label: 'ইফতার', targetMin: maghrib };
    }
    if (nowMin >= sehriStart && nowMin < fajr) {
        return { label: 'সেহরী শেষ', targetMin: fajr };
    }
    if (nowMin >= maghrib) {
        const end = sehriStart + 24 * 60;
        return { label: 'সেহরী শুরু', targetMin: end };
    }
    return { label: 'সেহরী শুরু', targetMin: sehriStart };
}

export default function HomeWidgets({ userName, locale }: { userName?: string; locale: string }) {
    const t = useTranslations('HomeWidgets');
    const currentLocale = useLocale();
    const isBn = currentLocale === 'bn';
    const patterns = t.raw('patterns') as string[];
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [now, setNow] = useState(new Date());
    const [prayerInfo, setPrayerInfo] = useState({ name: '', countdown: '', hPercent: 0, mPercent: 0 });
    const [iftarSehri, setIftarSehri] = useState({ label: '', countdown: '', hPercent: 0, mPercent: 0 });
    const [todayDeeds, setTodayDeeds] = useState(0);
    const [topUsers, setTopUsers] = useState<NearbyUser[]>([]);
    const [quizStatus, setQuizStatus] = useState<'READY' | 'COMPLETED' | null>(null);
    const [quizProfile, setQuizProfile] = useState<{ currentStreak: number; seasonQuizPoints: number } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const url = await resolveAladhanUrl(locale);
                const r = await fetch(url);
                const d = await r.json();
                if (d?.data?.timings) setPrayerTimes(d.data.timings);
            } catch (err) { }
        })();
    }, [locale]);

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/deeds?period=today');
                const d = await r.json();
                if (d.success) setTodayDeeds(d.data?.deeds?.length ?? 0);
            } catch { }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/leaderboard?scope=country&period=overall&limit=3');
                const d = await r.json();
                if (d.success && d.data?.entries?.length > 0) {
                    setTopUsers(d.data.entries);
                }
            } catch { }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/quiz/today');
                const d = await r.json();
                if (d.status) setQuizStatus(d.status === 'COMPLETED' ? 'COMPLETED' : 'READY');
                if (d.profile) setQuizProfile({ currentStreak: d.profile.currentStreak, seasonQuizPoints: d.profile.seasonQuizPoints });
            } catch { }
        })();
    }, []);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!prayerTimes) return;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const nowSec = now.getSeconds();

        const waqt = getCurrentWaqtInfo(prayerTimes, nowMin);
        let waqtRemSec = (waqt.endMin >= nowMin ? waqt.endMin - nowMin : waqt.endMin + 24 * 60 - nowMin) * 60 - nowSec;
        const hRem = Math.floor(waqtRemSec / 3600);
        const mRem = Math.floor((waqtRemSec % 3600) / 60);

        setPrayerInfo({
            name: waqt.name,
            countdown: formatCountdown(waqtRemSec),
            hPercent: (hRem / 24) * 100, // Hour line (decants relative to 24h)
            mPercent: (mRem / 60) * 100  // Minute line (decants relative to 60m)
        });

        const is = getIftarSehriInfo(prayerTimes, nowMin);
        let isRemSec = (is.targetMin >= nowMin ? is.targetMin - nowMin : is.targetMin + 24 * 60 - nowMin) * 60 - nowSec;
        const isHRem = Math.floor(isRemSec / 3600);
        const isMRem = Math.floor((isRemSec % 3600) / 60);

        let labelKey = is.label === 'ইফতার' ? 'iftar' : (is.label === 'সেহরী শেষ' ? 'sehriEnds' : 'sehriStarts');
        setIftarSehri({
            label: t(labelKey),
            countdown: formatCountdown(Math.max(0, isRemSec)),
            hPercent: (isHRem / 24) * 100,
            mPercent: (isMRem / 60) * 100
        });
    }, [now, prayerTimes, t]);

    const loading = !prayerTimes;

    const activeDeeds = useMemo(() => {
        if (!prayerTimes) return DEED_SUGGESTIONS.filter(d => !d.time || d.time === 'any');

        const nowMin = now.getHours() * 60 + now.getMinutes();
        const fajr = toMin(prayerTimes.Fajr);
        const dhuhr = toMin(prayerTimes.Dhuhr);
        const asr = toMin(prayerTimes.Asr);
        const maghrib = toMin(prayerTimes.Maghrib);
        const isha = toMin(prayerTimes.Isha);

        return DEED_SUGGESTIONS.filter(deed => {
            if (!deed.time || deed.time === 'any') return true;
            if (deed.time === 'morning') return nowMin >= fajr && nowMin < dhuhr;
            if (deed.time === 'evening') return nowMin >= asr && nowMin < isha;
            if (deed.time === 'night') return nowMin >= maghrib || nowMin < fajr;
            if (deed.time === 'tahajjud') return (nowMin >= isha + 60) || nowMin < fajr; // Isha+1hr to Fajr
            return true;
        });
    }, [now, prayerTimes]);

    const ActionCardList = useMemo(() => {
        // Duplicate array so it fills the screen and animates seamlessly
        const loopCount = activeDeeds.length < 5 ? 3 : 2;
        const mappedDeeds = Array(loopCount).fill(activeDeeds).flat();

        return (
            <div className="space-y-3">
                {mappedDeeds.map((deed, i) => {
                    const pattern = patterns[i % patterns.length];
                    const parts = pattern.split('{deed}');
                    return (
                        <div key={`${deed.namebn}-${i}-${Math.random()}`} className="bg-primary-900/40 backdrop-blur-md border border-white/5 rounded-xl px-4 py-3 shadow-glass group hover:bg-primary-900/60 transition-all duration-300">
                            <p className="text-sm text-primary-100 leading-relaxed">
                                {parts[0]} <Link href={deed.href} className="text-emerald-400 font-semibold hover:underline">{deed.namebn}</Link> {parts[1]}
                            </p>
                        </div>
                    );
                })}
            </div>
        );
    }, [patterns, activeDeeds]);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Greeting */}
            <h1 className="text-3xl md:text-5xl font-bold text-white text-center mb-8">
                {t('greeting')}{userName ? <>, <span className="text-accent-400">{userName}!</span></> : ''} 👋
            </h1>

            {/* Desktop: 1:3 layout (reduced left column slightly for wider grid) */}
            <div className="hidden md:grid grid-cols-3 gap-6 items-stretch">

                {/* Left Column: Action Cards Vertical Loop (33%) */}
                <div className="col-span-1 h-[520px] relative overflow-hidden rounded-3xl border border-white/5 bg-primary-900/10 shadow-inner">
                    <div className="absolute inset-0 z-10 pointer-events-none bg-linear-to-b from-primary-950/80 via-transparent to-primary-950/80" />
                    <div className="animate-scroll-up-slow pause-on-hover px-4 py-8">
                        {ActionCardList}
                    </div>
                </div>

                {/* Right Section: 2x2 Grid (66%) */}
                <div className="col-span-2 grid grid-cols-2 gap-6 h-[520px]">

                    {/* Top Row: Timers */}
                    <Link href="/iftar-sehri" className="group relative overflow-hidden bg-primary-900/50 backdrop-blur-xl border border-white/10 rounded-[35px] p-8 transition-all duration-500 hover:scale-[1.02] shadow-glass flex items-center justify-center">
                        <CircularTimer
                            value={loading ? '--:--:--' : iftarSehri.countdown}
                            hourPercent={iftarSehri.hPercent}
                            minutePercent={iftarSehri.mPercent}
                            label={iftarSehri.label || t('iftar')}
                            color="accent"
                        />
                    </Link>

                    <Link href="/prayer-times" className="group relative overflow-hidden bg-primary-900/50 backdrop-blur-xl border border-white/10 rounded-[35px] p-8 transition-all duration-500 hover:scale-[1.02] shadow-glass flex items-center justify-center">
                        <CircularTimer
                            value={loading ? '--:--:--' : prayerInfo.countdown}
                            hourPercent={prayerInfo.hPercent}
                            minutePercent={prayerInfo.mPercent}
                            label={prayerInfo.name || t('nextPrayer')}
                            color="emerald"
                        />
                    </Link>

                    {/* Bottom Row: Deeds + Quiz */}
                    <div className="relative overflow-hidden bg-primary-900/40 backdrop-blur-xl border border-white/10 rounded-[35px] p-8 shadow-glass flex flex-col items-center justify-between group hover:bg-primary-900/50 transition-all duration-500">
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-lg font-bold text-primary-100">{t('todaysDeeds')}</span>
                                <span className="text-2xl font-black text-accent-400">{todayDeeds}/10</span>
                            </div>
                            {todayDeeds > 0 ? (
                                <div className="grid grid-cols-5 gap-3 mb-8">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className={`h-3 rounded-full transition-all duration-700 ${i < todayDeeds ? 'bg-accent-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-primary-800/40'}`} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-primary-300 font-medium text-center mb-8 px-2">
                                    আজ কোনো আমল যোগ করেননি, এখনই আমল শুরু করুন
                                </p>
                            )}
                        </div>
                        <Link href="/good-deeds" className="w-full py-4 bg-accent-600/20 hover:bg-accent-600/30 border border-accent-500/30 rounded-2xl text-accent-300 font-bold text-center transition-all hover:scale-[1.02] active:scale-95">
                            + {t('addDeed')}
                        </Link>
                    </div>

                    {/* Quiz Widget */}
                    <Link href="/quiz" className="relative overflow-hidden bg-gradient-to-br from-blue-950/60 to-purple-950/60 backdrop-blur-xl border border-blue-500/20 rounded-[35px] p-8 shadow-glass flex flex-col items-center justify-between group hover:border-blue-400/40 transition-all duration-500 hover:scale-[1.02]">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
                        <div className="w-full relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <Brain className="w-4 h-4" />
                                    {isBn ? 'ব্রেইন-ব্যাটল' : 'Brain Battle'}
                                </span>
                                {quizStatus === 'COMPLETED' ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">{isBn ? 'নতুন!' : 'New!'}</span>
                                )}
                            </div>
                            {quizProfile && quizProfile.currentStreak > 0 ? (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="text-center">
                                        <p className="text-orange-400 font-black text-2xl">🔥 {quizProfile.currentStreak}</p>
                                        <p className="text-gray-500 text-xs">{isBn ? 'দিন স্ট্রিক' : 'day streak'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-accent-400 font-black text-xl">{quizProfile.seasonQuizPoints.toLocaleString()}</p>
                                        <p className="text-gray-500 text-xs">{isBn ? 'সিজন পয়েন্ট' : 'season pts'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-blue-200/70 text-sm font-medium mb-4">
                                    {isBn ? 'প্রতিদিন ৩টি প্রশ্ন, স্ট্রিক ও পয়েন্ট অর্জন করুন' : 'Answer 3 questions daily, build streaks & earn points'}
                                </p>
                            )}
                        </div>
                        <div className={`w-full py-4 rounded-2xl text-center font-bold text-sm transition-all relative z-10 ${quizStatus === 'COMPLETED' ? 'bg-green-500/10 border border-green-500/20 text-green-300' : 'bg-blue-600/30 border border-blue-500/30 text-blue-200 group-hover:bg-blue-600/40'}`}>
                            {quizStatus === 'COMPLETED' ? (isBn ? '✅ আজকের কুইজ সম্পন্ন' : '✅ Today Done! Come back tomorrow') : (isBn ? '🧠 কুইজ শুরু করুন' : '🧠 Start Today\'s Quiz')}
                        </div>
                    </Link>
                </div>
            </div>

            {/* Mobile View: Specifically ordered rows */}
            <div className="md:hidden space-y-6">

                {/* Row 1: Side by Side Timers */}
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/prayer-times" className="p-4 bg-primary-900/60 backdrop-blur-lg border border-white/10 rounded-3xl flex items-center justify-center">
                        <CircularTimer
                            value={loading ? '--:--:--' : prayerInfo.countdown}
                            hourPercent={prayerInfo.hPercent}
                            minutePercent={prayerInfo.mPercent}
                            label={prayerInfo.name?.split(' ')[0] || t('nextPrayer')}
                            size="sm"
                            color="emerald"
                        />
                    </Link>
                    <Link href="/iftar-sehri" className="p-4 bg-primary-900/60 backdrop-blur-lg border border-white/10 rounded-3xl flex items-center justify-center">
                        <CircularTimer
                            value={loading ? '--:--:--' : iftarSehri.countdown}
                            hourPercent={iftarSehri.hPercent}
                            minutePercent={iftarSehri.mPercent}
                            label={iftarSehri.label?.split(' ')[0] || t('iftar')}
                            size="sm"
                            color="accent"
                        />
                    </Link>
                </div>

                {/* Row 2: Inspiration Slider (Slower Horizontal) */}
                <div className="relative h-28 overflow-hidden rounded-2xl bg-primary-900/20 border border-white/5 group">
                    <div className="absolute inset-0 z-10 pointer-events-none bg-linear-to-r from-primary-950/60 via-transparent to-primary-950/60" />
                    <div className="flex items-center gap-4 py-6 px-4 w-max whitespace-nowrap animate-scroll-left-slow group-hover:[animation-play-state:paused]">
                        {[...DEED_SUGGESTIONS, ...DEED_SUGGESTIONS].map((deed, i) => {
                            const pattern = patterns[i % patterns.length];
                            const parts = pattern.split('{deed}');
                            return (
                                <div key={`m-${i}`} className="bg-primary-900/50 backdrop-blur-md border border-white/5 rounded-xl px-5 py-3 shadow-glass">
                                    <p className="text-xs text-primary-100 leading-none">
                                        {parts[0]} <Link href={deed.href} className="text-emerald-400 font-bold">{deed.namebn}</Link> {parts[1]}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Row 3: Leaderboard + Quiz side-by-side */}
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/leaderboard" className="block p-4 bg-primary-900/40 border border-white/10 rounded-3xl shadow-glass">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest opacity-80">লিডারবোর্ড</span>
                            <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs">🏆</div>
                        </div>
                        {topUsers.length > 0 ? (
                            <div className="w-full space-y-1.5 mb-2">
                                {topUsers.map((u: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-white bg-white/5 rounded-lg px-2.5 py-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`font-black text-xs ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`}>{i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}</span>
                                            <span className="font-bold text-xs truncate max-w-[70px]">{u.userName}</span>
                                        </div>
                                        <span className="text-[10px] text-primary-300">{u.totalPoints}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs font-bold text-white mb-2">View Ranking</p>}
                        <p className="text-[9px] text-primary-200 text-center leading-tight">আমল করে এগিয়ে যান!</p>
                    </Link>

                    <Link href="/quiz" className="relative block p-4 bg-gradient-to-br from-blue-950/60 to-purple-950/60 border border-blue-500/20 rounded-3xl shadow-glass overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/10 blur-[30px] rounded-full pointer-events-none" />
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1"><Brain className="w-3 h-3" /> Quiz</span>
                            {quizStatus === 'COMPLETED' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">New</span>}
                        </div>
                        {quizProfile && quizProfile.currentStreak > 0 ? (
                            <div className="relative z-10">
                                <p className="text-orange-400 font-black text-xl">🔥 {quizProfile.currentStreak}</p>
                                <p className="text-gray-500 text-[10px] mb-1">{isBn ? 'দিন স্ট্রিক' : 'day streak'}</p>
                                <p className="text-accent-400 font-bold text-sm">{quizProfile.seasonQuizPoints.toLocaleString()} pts</p>
                            </div>
                        ) : (
                            <p className="text-blue-200/70 text-xs font-medium mb-2 relative z-10">{isBn ? 'প্রতিদিন ৩টি প্রশ্ন খেলুন!' : 'Play 3 questions daily!'}</p>
                        )}
                        <div className={`mt-2 py-1.5 rounded-xl text-center text-[10px] font-bold relative z-10 ${quizStatus === 'COMPLETED' ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-blue-600/30 text-blue-200 border border-blue-500/30'}`}>
                            {quizStatus === 'COMPLETED' ? '✅ সম্পন্ন' : '🧠 খেলুন'}
                        </div>
                    </Link>
                </div>

                {/* Row 4: Today's Deeds */}
                <div className="p-5 bg-primary-900/40 border border-white/10 rounded-3xl shadow-glass">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-primary-100 uppercase tracking-widest">{t('todaysDeeds')}</span>
                        <span className="text-lg font-black text-accent-400">{todayDeeds}/10 ✨</span>
                    </div>
                    {todayDeeds > 0 ? (
                        <div className="grid grid-cols-10 gap-1.5 mb-5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className={`h-2 rounded-full ${i < todayDeeds ? 'bg-accent-500' : 'bg-primary-800/40'}`} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-primary-300 font-medium text-center mb-5">
                            আজ কোনো আমল যোগ করেননি, এখনই আমল শুরু করুন
                        </p>
                    )}
                    <Link href="/good-deeds" className="block w-full py-3 bg-accent-600/20 rounded-xl text-accent-300 font-bold text-center text-sm">
                        + {t('addDeed')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
