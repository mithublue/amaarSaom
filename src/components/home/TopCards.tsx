'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { getGpsLocation } from '@/lib/location';

interface PrayerTimes {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
}

// Default coordinates per locale — avoids the broken timingsByCity endpoint
const LOCALE_DEFAULTS: Record<string, { lat: number; lng: number; label: string }> = {
    bn: { lat: 23.8103, lng: 90.4125, label: 'Dhaka, Bangladesh' },
    en: { lat: 51.5074, lng: -0.1278, label: 'London, UK' },
    ar: { lat: 21.3891, lng: 39.8579, label: 'Mecca, KSA' },
};

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
    if (nowMin >= isha || nowMin < fajr) return { name: 'নামাজের সময়', endMin: fajr + (nowMin >= isha ? 24 * 60 : 0) };
    if (nowMin >= maghrib) return { name: 'মাগরিব', endMin: isha };
    if (nowMin >= asr) return { name: 'আসর', endMin: maghrib };
    if (nowMin >= dhuhr) return { name: 'জোহর', endMin: asr };
    if (nowMin >= sunrise) return { name: 'চাশত', endMin: dhuhr };
    return { name: 'ফজর', endMin: sunrise };
}

function getIftarLabel(times: PrayerTimes, nowMin: number) {
    const fajr = toMin(times.Fajr), maghrib = toMin(times.Maghrib);
    const sehriStart = fajr - 150;
    if (nowMin >= fajr && nowMin < maghrib) return { label: 'ইফতার', targetMin: maghrib };
    if (nowMin >= sehriStart && nowMin < fajr) return { label: 'সেহরী শেষ', targetMin: fajr };
    if (nowMin >= maghrib) return { label: 'সেহরী শুরু', targetMin: sehriStart + 24 * 60 };
    return { label: 'সেহরী শুরু', targetMin: sehriStart };
}

interface TopCardsProps {
    locale?: string;
}

export default function TopCards({ locale = 'bn' }: TopCardsProps) {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [now, setNow] = useState(new Date());
    const [waqt, setWaqt] = useState({ name: '', countdown: '' });
    const [iftar, setIftar] = useState({ label: '', countdown: '' });
    const [locationLabel, setLocationLabel] = useState('');

    useEffect(() => {
        const fetchTimes = async () => {
            let lat: number, lng: number, label: string;

            // Priority 1: GPS from localStorage
            const gps = getGpsLocation();
            if (gps && gps.useCoords && gps.lat != null && gps.lng != null) {
                lat = gps.lat;
                lng = gps.lng;
                label = gps.city || 'Your Location';
            } else {
                // Priority 2: Locale-based default coordinates
                const def = LOCALE_DEFAULTS[locale] ?? LOCALE_DEFAULTS['bn'];
                lat = def.lat;
                lng = def.lng;
                label = def.label;
            }

            setLocationLabel(label);

            // Always use coordinates-based URL — timingsByCity returns 400
            const ts = Math.floor(Date.now() / 1000);
            const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lng}&method=1`;

            try {
                const r = await fetch(url);
                const d = await r.json();
                if (d?.data?.timings) setPrayerTimes(d.data.timings);
            } catch (err) {
                console.error('[TopCards] Failed to fetch prayer times:', err);
            }
        };

        fetchTimes();
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, [locale]);

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
                    <span className="text-xs font-medium text-emerald-300 truncate">{waqt.name || 'নামাজের সময়'}</span>
                </div>
                <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider">
                    {loading ? <span className="animate-pulse text-sm text-primary-400">•••</span> : waqt.countdown}
                </div>
                <p className="text-xs text-primary-400 mt-1 truncate">{locationLabel || 'শেষ হতে বাকি'}</p>
            </Link>

            {/* Iftar / Sehri */}
            <Link href="/iftar-sehri" className="group relative overflow-hidden bg-primary-900/50 backdrop-blur-md border border-white/10 hover:border-accent-500/40 rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-primary-900/70 hover:-translate-y-0.5 shadow-glass">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🌙</span>
                    <span className="text-xs font-medium text-accent-300 truncate">{iftar.label || 'ইফতার'}</span>
                </div>
                <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider">
                    {loading ? <span className="animate-pulse text-sm text-primary-400">•••</span> : iftar.countdown}
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
