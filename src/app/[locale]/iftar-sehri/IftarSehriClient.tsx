'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { countries, commonCities } from '@/lib/locations';
import { getGpsLocation, saveGpsLocation } from '@/lib/location';

interface PrayerTimes {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
}

interface AladhanResponse {
    data: {
        timings: PrayerTimes;
        meta: {
            timezone: string;
        };
        date: {
            readable: string;
            gregorian: {
                date: string;
            };
            hijri: {
                date: string;
                day: string;
                month: {
                    en: string;
                    ar: string;
                };
                year: string;
            };
        };
    };
    code: number;
}

export default function IftarSehriClient() {
    const t = useTranslations('IftarSehri');
    // const format = useFormatter(); // Removed unused
    // const format = useFormatter(); // Removed unused

    // State
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [timeZone, setTimeZone] = useState<string>('Asia/Dhaka');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date()); // Absolute system time, will be formatted with timeZone

    // Countdown States
    const [iftarCountdown, setIftarCountdown] = useState('');
    const [sehriCountdown, setSehriCountdown] = useState('');

    // Hijri State
    const [hijriDateStr, setHijriDateStr] = useState('');
    const [hijriAdjustment, setHijriAdjustment] = useState(0);

    // Location State
    const [location, setLocation] = useState<{
        city: string;
        country: string;
        lat?: number;
        lng?: number;
        useCoords?: boolean;
    }>({ city: 'Dhaka', country: 'Bangladesh', useCoords: false });

    // Input States
    const [cityInput, setCityInput] = useState('Dhaka');
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Initial load: GPS localStorage → profile → default Dhaka
    useEffect(() => {
        const init = async () => {
            // 1. GPS localStorage first
            const gps = getGpsLocation();
            if (gps && gps.useCoords && gps.lat != null && gps.lng != null) {
                setLocation(gps);
                setCityInput(gps.city || 'Your Location');
                return;
            }
            // 2. Profile location
            try {
                const res = await fetch('/api/user/profile');
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch { return; }
                if (data.success && data.data?.cityName) {
                    const profileCity = data.data.cityName;
                    const profileCountry = data.data.countryName || 'Bangladesh';
                    setCityInput(profileCity);
                    setLocation(prev => ({ ...prev, city: profileCity, country: profileCountry, useCoords: false }));
                }
            } catch (e) {
                console.error('Failed to load profile location', e);
            }
        };
        init();
    }, []);

    // Update suggestions when country changes
    useEffect(() => {
        if (commonCities[location.country]) {
            setCitySuggestions(commonCities[location.country]);
        } else {
            setCitySuggestions([]);
        }
    }, [location.country]);

    // Timer Tick
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch on location change
    useEffect(() => {
        fetchPrayerTimes();
    }, [location]);

    // Calculate Countdowns using Timezone
    useEffect(() => {
        if (!prayerTimes || !timeZone) return;

        // Helper to get time in target timezone as Date object (conceptually)
        // We compare "Time of Day" strings in the target timezone.

        // 1. Get current time parts in target timezone
        const nowFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });

        const parts = nowFormatter.formatToParts(new Date());
        const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

        const nowYear = parseInt(getPart('year'));
        const nowMonth = parseInt(getPart('month')) - 1; // 0-indexed
        const nowDay = parseInt(getPart('day'));
        const nowHour = parseInt(getPart('hour') === '24' ? '0' : getPart('hour')); // Handle 24h edge case if any
        const nowMinute = parseInt(getPart('minute'));
        const nowSecond = parseInt(getPart('second'));

        // "Now" as a comparable millis timestamp (face value)
        const nowFaceValue = new Date(nowYear, nowMonth, nowDay, nowHour, nowMinute, nowSecond).getTime();

        const getTargetFaceValue = (timeStr: string, addDay: boolean = false) => {
            const [h, m] = timeStr.split(':').map(Number);
            const d = new Date(nowYear, nowMonth, nowDay, h, m, 0);
            if (addDay) d.setDate(d.getDate() + 1);
            return d.getTime();
        };

        // Iftar (Maghrib)
        const maghribTime = getTargetFaceValue(prayerTimes.Maghrib);
        let iftarTarget = maghribTime;
        if (nowFaceValue > maghribTime) {
            iftarTarget = getTargetFaceValue(prayerTimes.Maghrib, true);
        }
        setIftarCountdown(calculateDiff(iftarTarget, nowFaceValue));

        // Sehri (Fajr)
        const fajrTime = getTargetFaceValue(prayerTimes.Fajr);
        let sehriTarget = fajrTime;
        if (nowFaceValue > fajrTime) {
            sehriTarget = getTargetFaceValue(prayerTimes.Fajr, true);
        }
        setSehriCountdown(calculateDiff(sehriTarget, nowFaceValue));

    }, [prayerTimes, currentTime, timeZone]);

    const calculateDiff = (target: number, now: number) => {
        const diff = target - now;
        if (diff <= 0) return '00:00:00';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const fetchPrayerTimes = async () => {
        try {
            setLoading(true);
            setError(null);

            const ts = Math.floor(Date.now() / 1000);
            let lat: number, lng: number;

            if (location.useCoords && location.lat && location.lng) {
                // GPS coordinates — use directly
                lat = location.lat;
                lng = location.lng;
            } else {
                // Geocode city → coordinates via Nominatim (timingsByCity is broken)
                const cleanCity = location.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const cleanCountry = location.country.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                try {
                    const geo = await fetch(
                        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cleanCity)}&country=${encodeURIComponent(cleanCountry)}&format=json&limit=1`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const places = await geo.json();
                    if (places?.length > 0) {
                        lat = parseFloat(places[0].lat);
                        lng = parseFloat(places[0].lon);
                    } else {
                        throw new Error('Geocode returned no results');
                    }
                } catch {
                    // Final fallback: Dhaka coordinates
                    lat = 23.8103;
                    lng = 90.4125;
                }
            }

            const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lng}&method=1`;
            const response = await fetch(url);
            const data: AladhanResponse = await response.json();

            if (!data?.data?.timings) {
                throw new Error('Failed to fetch data');
            }

            setPrayerTimes(data.data.timings);
            setTimeZone(data.data.meta.timezone);

            let defaultAdj = 0;
            if (location.country === 'Bangladesh') defaultAdj = -1;
            setHijriAdjustment(defaultAdj);
            updateHijriDisplay(data.data.date.hijri, defaultAdj);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const updateHijriDisplay = (apiHijri: any, adj: number) => {
        // We can use the API date components and just add days
        // API gives day, month, year.
        // Easiest is to construct a date and add days.
        // Note: API date is "DD-MM-YYYY". 
        // Let's just use the client side calculation as before BUT initialized with accurate date from API?
        // Actually, shifting the API date is safer than calculating from Gregorian if moon sighting differs significantly.

        // Let's try to parse API hijri date "02-09-1447"
        // It's a bit complex to shift purely string dates.

        // Simplest Robust Approach:
        // Use client-side calculation from Gregorian date, applying the adjustment.
        // This is consistent for "1st Ramadan" logic.

        const hDate = getHijriDate(new Date(), adj);
        setHijriDateStr(hDate);
    };

    const getHijriDate = (date: Date, adjustmentDays: number) => {
        const adjustedDate = new Date(date);
        adjustedDate.setDate(adjustedDate.getDate() + adjustmentDays);
        return new Intl.DateTimeFormat('en-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(adjustedDate);
    };

    // When adjustment changes manually
    const handleAdjustmentChange = (newAdj: number) => {
        setHijriAdjustment(newAdj);
        setHijriDateStr(getHijriDate(new Date(), newAdj));
    };

    const handleCitySelect = (city: string) => {
        setCityInput(city);
        setLocation(prev => ({ ...prev, city, useCoords: false }));
        setShowSuggestions(false);
    };

    const handleManualSubmit = () => {
        if (cityInput.trim()) {
            setLocation(prev => ({ ...prev, city: cityInput, useCoords: false }));
            setShowSuggestions(false);
        }
    };

    const formatTime12 = (time: string) => {
        if (!time) return '--:--';
        const [hourStr, minStr] = time.split(':');
        return `${hourStr}:${minStr}`;
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">

            {/* Top Location Card */}
            <div className="bg-primary-900 rounded-app-lg p-6 md:p-8 shadow-glass text-white relative border border-white/5">

                {/* Header Row: Location Text & Hijri Date */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h3 className="text-primary-200 text-sm font-medium flex items-center gap-2 mb-1">
                            {t('locationSet')}: <span className="text-accent-400 font-bold text-lg">{location.city}, {location.country}</span>
                        </h3>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 bg-primary-950/30 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                            {/* Hijri Date Controls */}
                            <button
                                onClick={() => handleAdjustmentChange(hijriAdjustment - 1)}
                                className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-white/70 hover:text-white transition text-sm font-bold"
                            >
                                -
                            </button>
                            <span className="font-bold text-base text-white tracking-wide px-2 min-w-[120px] text-center">
                                {hijriDateStr || t('loading')}
                            </span>
                            <button
                                onClick={() => handleAdjustmentChange(hijriAdjustment + 1)}
                                className="w-6 h-6 flex items-center justify-center bg-white/10 rounded text-white/70 hover:text-white transition text-sm font-bold"
                            >
                                +
                            </button>
                        </div>
                        {/* Gregorian Date (Timezone Aware) */}
                        <div className="text-primary-300 text-xs mt-1 font-medium">
                            {new Intl.DateTimeFormat('en-US', {
                                timeZone: timeZone,
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            }).format(currentTime)}
                        </div>
                        {/* Adjustment Text */}
                        <div className="text-[10px] text-primary-500 mt-0.5 opacity-60">
                            {t('hijriAdjust')} {hijriAdjustment > 0 ? `+${hijriAdjustment}` : hijriAdjustment}
                        </div>
                    </div>
                </div>


                {/* Find Location Button (Floating or Layout) */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => {
                            if (navigator.geolocation) {
                                setLoading(true);
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        setLocation({
                                            ...location,
                                            lat: position.coords.latitude,
                                            lng: position.coords.longitude,
                                            useCoords: true
                                        });
                                        setCityInput('Your Location');
                                    },
                                    (error) => {
                                        alert('Error: ' + error.message);
                                        setLoading(false);
                                    }
                                );
                            }
                        }}
                        className="bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 text-white px-6 py-2 rounded-full font-bold text-sm shadow-gold-glow flex items-center gap-2 transition-transform transform hover:scale-105"
                    >
                        📍 {t('findMyLocation')}
                    </button>
                </div>


                {/* Input Grid */}
                <div className="grid md:grid-cols-2 gap-6 pb-2">
                    {/* Country */}
                    <div className="relative">
                        <label className="text-xs text-primary-300 font-semibold mb-2 block">{t('country')}</label>
                        <div className="relative">
                            <select
                                value={location.country}
                                onChange={(e) => {
                                    const newCountry = e.target.value;
                                    const newCity = commonCities[newCountry] ? commonCities[newCountry][0] : '';
                                    setLocation(prev => ({ ...prev, country: newCountry, city: newCity, useCoords: false }));
                                    setCityInput(newCity);
                                }}
                                className="w-full px-4 py-3 rounded-lg bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500 appearance-none cursor-pointer"
                            >
                                <option value="" disabled>{t('selectCountry')}</option>
                                {countries.map((c) => (
                                    <option key={c} value={c} className="bg-primary-900">{c}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary-400 text-xs">▼</div>
                        </div>
                    </div>

                    {/* City */}
                    <div className="relative">
                        <label className="text-xs text-primary-300 font-semibold mb-2 block">{t('city')}</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={cityInput}
                                onChange={(e) => {
                                    setCityInput(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder={t('enterCityName')}
                                className="w-full px-4 py-3 rounded-lg bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500 placeholder:text-primary-500"
                            />
                            {showSuggestions && citySuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-primary-800 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                    {citySuggestions.filter(c => c.toLowerCase().includes(cityInput.toLowerCase())).map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => handleCitySelect(suggestion)}
                                            className="w-full text-left px-4 py-2 text-primary-100 hover:bg-white/5"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timers Grid */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* Iftar Timer Card */}
                <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-app-lg p-8 text-center border border-white/5 shadow-glass flex flex-col items-center justify-center min-h-[300px]">
                    <div className="mb-4 text-4xl transform -rotate-12">🌙</div>
                    <h2 className="text-xl font-bold text-white mb-4">{t('timeUntilIftar')}</h2>

                    <div className="text-5xl md:text-6xl font-mono font-bold text-accent-400 tracking-wider mb-8 drop-shadow-md">
                        {loading ? '--:--:--' : iftarCountdown}
                    </div>

                    <div className="bg-primary-950/50 px-6 py-2 rounded-lg border border-white/5">
                        <span className="text-primary-300 text-sm mr-2">{t('iftarTime')}:</span>
                        <span className="text-white font-bold text-lg">{formatTime12(prayerTimes?.Maghrib || '')}</span>
                    </div>
                </div>

                {/* Sehri Timer Card */}
                <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-app-lg p-8 text-center border border-white/5 shadow-glass flex flex-col items-center justify-center min-h-[300px]">
                    <div className="mb-4 text-4xl animate-pulse">☀️</div>
                    <h2 className="text-xl font-bold text-white mb-4">{t('timeUntilSehri')}</h2>

                    <div className="text-5xl md:text-6xl font-mono font-bold text-white tracking-wider mb-8 drop-shadow-md">
                        {loading ? '--:--:--' : sehriCountdown}
                    </div>

                    <div className="bg-primary-950/50 px-6 py-2 rounded-lg border border-white/5">
                        <span className="text-primary-300 text-sm mr-2">{t('sehriTime')}:</span>
                        <span className="text-white font-bold text-lg">{formatTime12(prayerTimes?.Fajr || '')}</span>
                    </div>
                </div>

            </div>

            {/* Footer Info */}
            <div className="text-center text-primary-500 text-xs mt-8">
                <p>{t('calcMethod')} {location.country}.</p>
                <p>{t('hijriAdjust')}</p>
            </div>

        </div>
    );
}
