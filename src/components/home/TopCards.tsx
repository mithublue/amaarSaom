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

function toMin(t: string) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function fmt(sec: number) {
    if (sec <= 0) return '00:00:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getWaqtLabel(times: PrayerTimes, nowMin: number) {
    const { Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha } = times;
    const fajr = toMin(Fajr), sunrise = toMin(Sunrise), dhuhr = toMin(Dhuhr),
        asr = toMin(Asr), maghrib = toMin(Maghrib), isha = toMin(Isha);
    if (nowMin >= isha || nowMin < fajr) return { name: 'এশার ওয়াক্ত', endMin: fajr + (nowMin >= isha ? 24 * 60 : 0) };
    if (nowMin >= maghrib) return { name: 'মাগরিবের ওয়াক্ত', endMin: isha };
    if (nowMin >= asr) return { name: 'আসরের ওয়াক্ত', endMin: maghrib };
    if (nowMin >= dhuhr) return { name: 'জোহরের ওয়াক্ত', endMin: asr };
    if (nowMin >= sunrise) return { name: 'চাশতের সময়', endMin: dhuhr };
    return { name: 'ফজরের ওয়াক্ত', endMin: sunrise };
}

function getIftarLabel(times: PrayerTimes, nowMin: number) {
    const fajr = toMin(times.Fajr), maghrib = toMin(times.Maghrib);
    const sehriStart = fajr - 150;
    if (nowMin >= fajr && nowMin < maghrib) return { label: 'ইফতার', targetMin: maghrib };
    if (nowMin >= sehriStart && nowMin < fajr) return { label: 'সেহরী শেষ', targetMin: fajr };
    if (nowMin >= maghrib) return { label: 'সেহরী শুরু', targetMin: sehriStart + 24 * 60 };
    return { label: 'সেহরী শুরু', targetMin: sehriStart };
}

export default function TopCards() {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [now, setNow] = useState(new Date());
    const [waqt, setWaqt] = useState({ name: '', countdown: '' });
    const [iftar, setIftar] = useState({ label: '', countdown: '' });

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1');
                const d = await r.json();
                if (d?.data?.timings) setPrayerTimes(d.data.timings);
            } catch (err) {
                console.error('[TopCards] Failed to fetch prayer times:', err);
            }
        })();
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!prayerTimes) return;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const nowSec = now.getSeconds();

        const w = getWaqtLabel(prayerTimes, nowMin);
        const remSec = (w.endMin >= nowMin ? w.endMin - nowMin : w.endMin + 24 * 60 - nowMin) * 60 - nowSec;
        setWaqt({ name: w.name, countdown: fmt(Math.max(0, remSec)) });

        const is = getIftarLabel(prayerTimes, nowMin);
        const isSec = (is.targetMin >= nowMin ? is.targetMin - nowMin : is.targetMin + 24 * 60 - nowMin) * 60 - nowSec;
        setIftar({ label: is.label, countdown: fmt(Math.max(0, isSec)) });
    }, [now, prayerTimes]);

    const loading = !prayerTimes;

    return (
        <div className="grid grid-cols-3 gap-3 md:gap-4 w-full">
            {/* Prayer Timer */}
            <Link href="/prayer-times" className="group relative overflow-hidden bg-primary-900/50 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-primary-900/70 hover:-translate-y-0.5 shadow-glass">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🕌</span>
                    <span className="text-xs font-medium text-emerald-300 truncate">{waqt.name || 'নামাযের সময়'}</span>
                </div>
                <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider">
                    {loading ? <span className="animate-pulse text-sm text-primary-400">Loading...</span> : waqt.countdown}
                </div>
                <p className="text-xs text-primary-400 mt-1">শেষ হতে বাকি</p>
            </Link>

            {/* Iftar / Sehri */}
            <Link href="/iftar-sehri" className="group relative overflow-hidden bg-primary-900/50 backdrop-blur-md border border-white/10 hover:border-accent-500/40 rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-primary-900/70 hover:-translate-y-0.5 shadow-glass">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🌙</span>
                    <span className="text-xs font-medium text-accent-300 truncate">{iftar.label || 'ইফতার'}</span>
                </div>
                <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider">
                    {loading ? <span className="animate-pulse text-sm text-primary-400">Loading...</span> : iftar.countdown}
                </div>
                <p className="text-xs text-primary-400 mt-1">বাকি সময়</p>
            </Link>

            {/* Leaderboard */}
            <Link href="/leaderboard" className="group relative overflow-hidden bg-primary-900/50 backdrop-blur-md border border-white/10 hover:border-yellow-500/40 rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-primary-900/70 hover:-translate-y-0.5 shadow-glass">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🏆</span>
                    <span className="text-xs font-medium text-yellow-300 truncate">Leaderboard</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-white">View</p>
                <p className="text-xs text-primary-400 mt-1 group-hover:text-yellow-400 transition-colors">See rankings →</p>
            </Link>
        </div>
    );
}
