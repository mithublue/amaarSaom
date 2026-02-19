'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';

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
    name: string;
    totalPoints: number;
}

interface DeedSuggestion {
    namebn: string;
    href: string;
}

const DEED_SUGGESTIONS: DeedSuggestion[] = [
    { namebn: 'সূরা মুলক তিলাওয়াত', href: '/quran' },
    { namebn: '১০০ বার দরুদ পাঠ', href: '/duas' },
    { namebn: 'সকালের যিকর', href: '/duas' },
    { namebn: 'সন্ধ্যার যিকর', href: '/duas' },
    { namebn: 'দৈনিক হাদিস পড়া', href: '/hadith' },
    { namebn: 'তাহাজ্জুদ নামাজ', href: '/prayer-times' },
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

/**
 * Returns:
 * - currentWaqtName: Bengali name of the current waqt
 * - currentWaqtEndMin: minute at which current waqt ends (= start of next prayer)
 */
function getCurrentWaqtInfo(times: PrayerTimes, nowMin: number): { name: string; endMin: number } {
    const fajr = toMin(times.Fajr);
    const sunrise = toMin(times.Sunrise);
    const dhuhr = toMin(times.Dhuhr);
    const asr = toMin(times.Asr);
    const maghrib = toMin(times.Maghrib);
    const isha = toMin(times.Isha);

    if (nowMin >= isha || nowMin < fajr) {
        // Isha waqt – ends at tomorrow's Fajr
        const endMin = fajr + (nowMin >= isha ? 24 * 60 : 0);
        return { name: 'এশার ওয়াক্ত', endMin };
    }
    if (nowMin >= maghrib) return { name: 'মাগরিবের ওয়াক্ত', endMin: isha };
    if (nowMin >= asr) return { name: 'আসরের ওয়াক্ত', endMin: maghrib };
    if (nowMin >= dhuhr) return { name: 'জোহরের ওয়াক্ত', endMin: asr };
    if (nowMin >= sunrise) return { name: 'চাশতের সময়', endMin: dhuhr };
    // fajr → sunrise
    return { name: 'ফজরের ওয়াক্ত', endMin: sunrise };
}

/**
 * Iftar/Sehri logic:
 * - Fajr..Maghrib  → Iftari countdown (Maghrib)
 * - Maghrib..(Fajr-150min) → Sehri শুরু হতে X বাকি
 * - (Fajr-150min)..Fajr → সেহরী শেষ হতে X বাকি
 */
const SEHRI_WINDOW_MIN = 150; // 2.5 hours = sehri window before Fajr

function getIftarSehriInfo(times: PrayerTimes, nowMin: number): { label: string; targetMin: number; nextDay: boolean } {
    const fajr = toMin(times.Fajr);
    const maghrib = toMin(times.Maghrib);
    const sehriStart = fajr - SEHRI_WINDOW_MIN;

    // Daytime: Fajr → Maghrib → show iftar
    if (nowMin >= fajr && nowMin < maghrib) {
        return { label: 'ইফতার', targetMin: maghrib, nextDay: false };
    }
    // Sehri window (before Fajr, within 2.5 hrs)
    if (nowMin >= sehriStart && nowMin < fajr) {
        return { label: 'সেহরী শেষ', targetMin: fajr, nextDay: false };
    }
    // Post-Maghrib / before sehri window → show sehri start countdown
    // sehriStart is in next morning → need +24h offset if now > midnight relative to fajr
    if (nowMin >= maghrib) {
        // sehriStart is tomorrow (small hours)
        return { label: 'সেহরী শুরু', targetMin: sehriStart + 24 * 60, nextDay: true };
    }
    // nowMin < sehriStart && nowMin < fajr (early morning, before sehri window)
    return { label: 'সেহরী শুরু', targetMin: sehriStart, nextDay: false };
}

export default function HomeWidgets({ userName, locale }: { userName?: string; locale: string }) {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [now, setNow] = useState(new Date());
    const [prayerInfo, setPrayerInfo] = useState({ name: '', countdown: '' });
    const [iftarSehri, setIftarSehri] = useState({ label: '', countdown: '' });
    const [todayDeeds, setTodayDeeds] = useState(0);
    const [nearbyUser, setNearbyUser] = useState<NearbyUser | null>(null);
    const [deeds, setDeeds] = useState<DeedSuggestion[]>(DEED_SUGGESTIONS.slice(0, 4));

    // Pick random deeds only on client to avoid hydration mismatch
    useEffect(() => {
        const shuffled = [...DEED_SUGGESTIONS].sort(() => Math.random() - 0.5);
        setDeeds(shuffled.slice(0, 4));
    }, []);

    // Fetch prayer times from profile/default
    useEffect(() => {
        (async () => {
            try {
                let city = 'Dhaka', country = 'Bangladesh';
                try {
                    const r = await fetch('/api/user/profile');
                    const d = await r.json();
                    if (d.success && d.data?.cityName) {
                        city = d.data.cityName;
                        country = d.data.countryName || 'Bangladesh';
                    }
                } catch { }
                const r = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1`);
                const d = await r.json();
                if (d.code === 200) setPrayerTimes(d.data.timings);
            } catch { }
        })();
    }, []);

    // Fetch today's deeds
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/deeds/history?period=today&limit=100');
                const d = await r.json();
                if (d.success) setTodayDeeds(d.data?.length ?? 0);
            } catch { }
        })();
    }, []);

    // Fetch leaderboard for nearby user
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/leaderboard?scope=country&period=daily&limit=10');
                const d = await r.json();
                if (d.success && d.data?.leaderboard?.length > 0) {
                    const me = d.data.currentUser;
                    if (me && me.rank > 1) {
                        const above = d.data.leaderboard.find((u: any) => u.rank < me.rank);
                        setNearbyUser(above || d.data.leaderboard[0]);
                    } else {
                        setNearbyUser(d.data.leaderboard[1] || d.data.leaderboard[0]);
                    }
                }
            } catch { }
        })();
    }, []);

    // Tick clock
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // Compute countdowns every second
    useEffect(() => {
        if (!prayerTimes) return;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const nowSec = now.getSeconds();

        // Current waqt remaining
        const waqt = getCurrentWaqtInfo(prayerTimes, nowMin);
        let waqtRemSec: number;
        if (waqt.endMin >= nowMin) {
            waqtRemSec = (waqt.endMin - nowMin) * 60 - nowSec;
        } else {
            // Wraps midnight (Isha → next Fajr)
            waqtRemSec = (waqt.endMin - nowMin + 24 * 60) * 60 - nowSec;
        }
        setPrayerInfo({ name: waqt.name, countdown: formatCountdown(waqtRemSec) });

        // Iftar/Sehri
        const is = getIftarSehriInfo(prayerTimes, nowMin);
        let isRemSec: number;
        if (is.targetMin >= nowMin) {
            isRemSec = (is.targetMin - nowMin) * 60 - nowSec;
        } else {
            isRemSec = (is.targetMin + 24 * 60 - nowMin) * 60 - nowSec;
        }
        setIftarSehri({ label: is.label, countdown: formatCountdown(Math.max(0, isRemSec)) });
    }, [now, prayerTimes]);

    const loading = !prayerTimes;

    // 4 motivational messages
    const motivationWidgets = [
        {
            key: 'msg1',
            text: nearbyUser
                ? <><span className="text-accent-400 font-semibold">{nearbyUser.name}</span> আজ দারুণ আমল করছেন! চলুন, আপনিও <Link href={deeds[0].href} className="text-emerald-400 font-semibold hover:underline">{deeds[0].namebn}</Link> দিয়ে আজকের খাতা খুলুন।</>
                : <>অনেকেই আজ আমল করছেন! আপনিও <Link href={deeds[0].href} className="text-emerald-400 font-semibold hover:underline">{deeds[0].namebn}</Link> দিয়ে শুরু করুন।</>,
        },
        {
            key: 'msg2',
            text: nearbyUser
                ? <><span className="text-accent-400 font-semibold">{nearbyUser.name}</span>-এর আজকের পয়েন্ট {nearbyUser.totalPoints}! তাকে ছুঁতে এখনই <Link href={deeds[1].href} className="text-emerald-400 font-semibold hover:underline">{deeds[1].namebn}</Link> করে ফেলুন।</>
                : <>আজকের লিডারবোর্ডে এগিয়ে থাকতে এখনই <Link href={deeds[1].href} className="text-emerald-400 font-semibold hover:underline">{deeds[1].namebn}</Link> করে ফেলুন।</>,
        },
        {
            key: 'msg3',
            text: <>আলহামদুলিল্লাহ, আজ অনেক মানুষ তাহাজ্জুদ পড়েছেন। টপ ২০%-এ জায়গা করে নিতে আজকের <Link href={deeds[2].href} className="text-emerald-400 font-semibold hover:underline">{deeds[2].namebn}</Link> সম্পন্ন করুন।</>,
        },
        {
            key: 'msg4',
            text: <>নেক আমলের প্রতিযোগিতায় আজ অনেকেই এগিয়ে! ছোট্ট এই কাজটি দিয়ে ট্র্যাকে ফিরুন — <Link href={deeds[3].href} className="text-emerald-400 font-semibold hover:underline">{deeds[3].namebn}</Link></>,
        },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Greeting */}
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2">
                আস-সালামু আলাইকুম{userName ? <>, <span className="text-accent-400">{userName}!</span></> : ''} 👋
            </h1>

            {/* Two Pill Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                {/* Current Waqt Remaining */}
                <Link href="/prayer-times" className="group relative overflow-hidden bg-primary-900/50 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-primary-900/70 hover:-translate-y-0.5 shadow-glass">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🕌</span>
                        <span className="text-xs font-medium text-emerald-300 truncate">
                            {prayerInfo.name || 'ওয়াক্ত'}
                        </span>
                    </div>
                    <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider">
                        {loading ? <span className="animate-pulse text-sm text-primary-400">লোড হচ্ছে...</span> : prayerInfo.countdown}
                    </div>
                    <p className="text-xs text-primary-400 mt-1">শেষ হতে বাকি</p>
                </Link>

                {/* Iftar / Sehri */}
                <Link href="/iftar-sehri" className="group relative overflow-hidden bg-primary-900/50 backdrop-blur-md border border-white/10 hover:border-accent-500/40 rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-primary-900/70 hover:-translate-y-0.5 shadow-glass">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🌙</span>
                        <span className="text-xs font-medium text-accent-300">{iftarSehri.label || 'ইফতার'}</span>
                    </div>
                    <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider">
                        {loading ? <span className="animate-pulse text-sm text-primary-400">লোড হচ্ছে...</span> : iftarSehri.countdown}
                    </div>
                    <p className="text-xs text-primary-400 mt-1">বাকি সময়</p>
                </Link>
            </div>

            {/* Progress Bar Widget */}
            <div className="relative overflow-hidden bg-primary-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-glass">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-600/8 via-transparent to-emerald-600/5 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary-300">আজকের আমল</span>
                    <span className="text-sm font-bold text-accent-400">{todayDeeds} / ১০ ✨</span>
                </div>
                <div className="w-full bg-primary-800/60 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-accent-600 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((todayDeeds / 10) * 100, 100)}%` }}
                    />
                </div>
                <Link href="/good-deeds" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent-600/20 hover:bg-accent-600/30 border border-accent-500/30 rounded-xl text-sm text-accent-300 font-medium transition-all hover:text-accent-200">
                    ✨ আমল যোগ করুন
                </Link>
            </div>

            {/* 4 Dynamic Motivational Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {motivationWidgets.map((w) => (
                    <div key={w.key} className="relative overflow-hidden bg-primary-900/40 backdrop-blur-md border border-white/8 rounded-2xl px-5 py-4 shadow-glass">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-accent-600/5 pointer-events-none" />
                        <p className="relative z-10 text-sm text-primary-100 leading-relaxed">
                            {w.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
