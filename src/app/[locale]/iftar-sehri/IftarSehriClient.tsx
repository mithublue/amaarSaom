'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllCountries, getCitiesOfCountry } from '@/lib/locations-package';
import { useTranslations } from 'next-intl';

export default function IftarSehriClient() {
    const t = useTranslations('IftarSehri');
    const [timeLeftIftar, setTimeLeftIftar] = useState<string>('--:--:--');
    const [timeLeftSehri, setTimeLeftSehri] = useState<string>('--:--:--');
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [hijriDate, setHijriDate] = useState<string>('');
    const [gregorianDate, setGregorianDate] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Location State
    const [location, setLocation] = useState<{
        city: string;
        country: string;
        lat?: number;
        lng?: number;
        useCoords?: boolean;
    }>({ city: 'Dhaka', country: 'Bangladesh', useCoords: false }); // Default

    // Location Data for Dropdowns
    const allCountries = useMemo(() => getAllCountries(), []);
    const [cities, setCities] = useState<{ name: string }[]>([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState('');

    // Hijri Adjustment State (Auto + Manual)
    const [hijriOffset, setHijriOffset] = useState<number>(0);

    // Helpers
    const getCalculationMethod = (countryName: string) => {
        const lowerCountry = countryName.toLowerCase();
        if (['bangladesh', 'pakistan', 'india'].includes(lowerCountry)) return 1; // Karachi
        if (lowerCountry === 'saudi arabia' || ['qatar', 'uae', 'kuwait', 'oman', 'bahrain'].includes(lowerCountry)) return 4; // Umm al-Qura
        if (lowerCountry === 'egypt' || lowerCountry === 'lebanon') return 5; // Egypt
        if (lowerCountry === 'turkey') return 13; // Diyanet
        if (lowerCountry === 'iran') return 7; // Tehran
        if (['united states', 'canada', 'united kingdom'].includes(lowerCountry)) return 2; // ISNA
        if (['indonesia', 'malaysia', 'singapore'].includes(lowerCountry)) return 11; // Majlis Ugama Islam Singapura
        return 2; // Default
    };

    const getAutoHijriAdjustment = (countryName: string) => {
        const lowerCountry = countryName.toLowerCase();
        // South Asia & some SE Asia often 1 day behind Saudi
        if (['bangladesh', 'pakistan', 'india', 'indonesia', 'malaysia', 'brunei'].includes(lowerCountry)) return -1;
        return 0;
    };

    // Load initial profile data
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                const text = await res.text();
                let responseData;
                try { responseData = JSON.parse(text); } catch (e) { return; }

                if (responseData && responseData.success && responseData.data?.cityName) {
                    const uCountry = responseData.data.countryName || 'Bangladesh';
                    setLocation(prev => ({ ...prev, city: responseData.data.cityName, country: uCountry, useCoords: false }));

                    const foundCountry = allCountries.find(c => c.name === uCountry);
                    if (foundCountry) setSelectedCountryCode(foundCountry.isoCode);
                    else {
                        const bd = allCountries.find(c => c.name === 'Bangladesh');
                        if (bd) setSelectedCountryCode(bd.isoCode);
                    }

                    // Set adjust
                    setHijriOffset(getAutoHijriAdjustment(uCountry));
                }
            } catch (e) { console.error(e); }
        };
        loadProfile();
    }, [allCountries]);

    // Update cities when country code changes
    useEffect(() => {
        if (selectedCountryCode) {
            setCities(getCitiesOfCountry(selectedCountryCode));
        } else {
            setCities([]);
        }
    }, [selectedCountryCode]);

    // Handle Country Change (Update Auto Adjust)
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        const countryObj = allCountries.find(c => c.isoCode === newCode);
        const newCountryName = countryObj ? countryObj.name : '';

        setSelectedCountryCode(newCode);
        setLocation({ ...location, country: newCountryName, city: '', useCoords: false });
        setHijriOffset(getAutoHijriAdjustment(newCountryName));
    };

    // Fetch Times Wrapper
    const fetchTimes = useCallback(async () => {
        try {
            setLoading(true);

            // local date string YYYY-MM-DD
            const date = new Date();
            const localDateString = date.toLocaleDateString('en-CA');

            let url = '';
            const method = getCalculationMethod(location.country);
            // remove adjustment from API to get stable baseline
            // const adjustment = hijriOffset;

            if (location.useCoords && location.lat && location.lng) {
                // Remove adjustment param
                url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${location.lat}&longitude=${location.lng}&method=${method}`;
            } else if (location.city && location.country) {
                const cleanCity = location.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const cleanCountry = location.country.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                // Remove adjustment param
                url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(cleanCity)}&country=${encodeURIComponent(cleanCountry)}&method=${method}&date=${localDateString}`;
            } else {
                setLoading(false);
                setPrayerTimes(null);
                setHijriDate('');
                setGregorianDate('');
                setTimeLeftIftar('--:--:--');
                setTimeLeftSehri('--:--:--');
                return;
            }

            const response = await fetch(url);
            if (!response.ok) {
                console.error('Prayer API failed', response.status);
                setLoading(false);
                return;
            }
            const data = await response.json();

            if (data.code === 200 && data.data) {
                setPrayerTimes(data.data.timings);

                // Set Dates
                const hijri = data.data.date.hijri;
                const gregorian = data.data.date.gregorian;

                // Hijri Calculation (Client-Side Adjustment)
                let hDay = parseInt(hijri.day);
                let hMonth = hijri.month.en;
                let hYear = parseInt(hijri.year);

                // 1. Apply Offset (Manual + Auto)
                hDay += hijriOffset;

                // 2. Handle Month Boundaries (Simple Approximation for Display)
                // If day <= 0, go to previous month (30th)
                if (hDay <= 0) {
                    hDay = 30; // Fallback to 30th of prev month
                    // Simple month swap for Ramadan context
                    if (hMonth === 'Ramadan') hMonth = "Sha'ban";
                    else if (hMonth === 'Shawwal') hMonth = 'Ramadan';
                }
                // If day > 30, go to next
                if (hDay > 30) {
                    hDay = 1;
                    if (hMonth === "Sha'ban") hMonth = 'Ramadan';
                    else if (hMonth === 'Ramadan') hMonth = 'Shawwal';
                }

                // 3. Post-Maghrib Transition (Hijri Date starts at sunset)
                const now = new Date();
                const maghribTime = new Date(`${localDateString}T${data.data.timings.Maghrib}:00`);

                if (now > maghribTime) {
                    hDay += 1;
                    if (hDay > 30) {
                        hDay = 1;
                        if (hMonth === "Sha'ban") hMonth = 'Ramadan';
                        else if (hMonth === 'Ramadan') hMonth = 'Shawwal';
                    }
                }

                // Formatting
                setHijriDate(`${hDay} ${hMonth} ${hYear}`);
                setGregorianDate(`${gregorian.weekday.en}, ${gregorian.day} ${gregorian.month.en} ${gregorian.year}`);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [location, hijriOffset]);

    useEffect(() => {
        fetchTimes();
    }, [fetchTimes]);

    // Timer Logic
    const calculateTimeLeft = useCallback(() => {
        if (!prayerTimes) return;

        const now = new Date();
        // Use local date string to avoid UTC issues
        const todayStr = now.toLocaleDateString('en-CA');

        const maghribTime = new Date(`${todayStr}T${prayerTimes.Maghrib}`);
        const fajrTime = new Date(`${todayStr}T${prayerTimes.Fajr}`);

        // Handle invalid dates (Invalid Date) if format issues
        if (isNaN(maghribTime.getTime()) || isNaN(fajrTime.getTime())) return;

        let targetFajr = new Date(fajrTime);
        if (now > fajrTime) targetFajr.setDate(targetFajr.getDate() + 1);

        let targetMaghrib = new Date(maghribTime);
        if (now > maghribTime) targetMaghrib.setDate(targetMaghrib.getDate() + 1);

        const diffSehri = targetFajr.getTime() - now.getTime();
        const diffIftar = targetMaghrib.getTime() - now.getTime();

        setTimeLeftSehri(formatDuration(diffSehri));
        setTimeLeftIftar(formatDuration(diffIftar));
    }, [prayerTimes]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (prayerTimes) calculateTimeLeft();
        }, 1000);
        return () => clearInterval(timer);
    }, [prayerTimes, calculateTimeLeft]);

    const formatDuration = (ms: number) => {
        if (ms < 0) return '00:00:00';
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };


    const getDisplayLocation = () => {
        if (location.useCoords) return '📍 Your Exact Location';
        if (location.city && location.country) return `${location.city}, ${location.country}`;
        if (location.country) return `${location.country}`;
        return 'Select Location';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Location Selection Card */}
            <div className="bg-primary-900/40 backdrop-blur-md border border-white/10 rounded-app-lg p-6 md:p-8 shadow-glass">
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between mb-6">
                    <p className="text-primary-200 text-sm font-medium">
                        {t('locationSet')} <span className="text-accent-400 font-bold ml-1">{getDisplayLocation()}</span>
                    </p>

                    {/* Date Display & Controls */}
                    <div className="text-right flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setHijriOffset(prev => prev - 1)} className="w-5 h-5 flex items-center justify-center rounded bg-white/10 text-xs hover:bg-white/20 text-white">-</button>
                            <p className="text-white font-bold text-sm">{hijriDate}</p>
                            <button onClick={() => setHijriOffset(prev => prev + 1)} className="w-5 h-5 flex items-center justify-center rounded bg-white/10 text-xs hover:bg-white/20 text-white">+</button>
                        </div>
                        <p className="text-primary-400 text-xs">{gregorianDate}</p>
                        <p className="text-[10px] text-primary-500">Hijri Adj: {hijriOffset > 0 ? '+' : ''}{hijriOffset} days</p>
                    </div>
                </div>

                <div className="flex justify-end mb-4">
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
                                    },
                                    (error) => {
                                        alert('Error getting location: ' + error.message);
                                        setLoading(false);
                                    }
                                );
                            } else {
                                alert('Geolocation is not supported.');
                            }
                        }}
                        className="px-5 py-2.5 bg-accent-600 text-white rounded-xl hover:bg-accent-500 transition-all font-semibold text-sm flex items-center gap-2 shadow-gold-glow"
                    >
                        📍 {t('findMyLocation')}
                    </button>
                </div>

                {/* Dropdowns */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative group">
                        <label className="text-xs text-primary-300 font-semibold mb-2 block uppercase tracking-wider">{t('country')}</label>
                        <select
                            value={selectedCountryCode}
                            onChange={handleCountryChange}
                            className="w-full px-4 py-3 rounded-xl bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 appearance-none cursor-pointer transition-colors hover:bg-primary-950/70"
                        >
                            <option value="" className="bg-primary-900 text-gray-400">{t('selectCountry')}</option>
                            {allCountries.map((c) => (
                                <option key={c.isoCode} value={c.isoCode} className="bg-primary-900 text-white">{c.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 bottom-3.5 pointer-events-none text-primary-400 text-xs">▼</div>
                    </div>

                    <div className="relative group">
                        <label className="text-xs text-primary-300 font-semibold mb-2 block uppercase tracking-wider">{t('city')}</label>
                        {cities.length > 0 ? (
                            <select
                                value={location.city}
                                onChange={(e) => setLocation({ ...location, city: e.target.value, useCoords: false })}
                                disabled={!selectedCountryCode}
                                className="w-full px-4 py-3 rounded-xl bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 disabled:opacity-50 appearance-none cursor-pointer transition-colors hover:bg-primary-950/70"
                            >
                                <option value="" className="bg-primary-900 text-gray-400">{t('selectCity')}</option>
                                {cities.map((city) => (
                                    <option key={city.name} value={city.name} className="bg-primary-900 text-white">{city.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={location.city}
                                onChange={(e) => setLocation({ ...location, city: e.target.value, useCoords: false })}
                                className="w-full px-4 py-3 rounded-xl bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 placeholder:text-primary-400 transition-colors hover:bg-primary-950/70"
                                placeholder={selectedCountryCode ? t('enterCityName') : t('selectCountryFirst')}
                                disabled={!selectedCountryCode}
                            />
                        )}
                        {cities.length > 0 && <div className="absolute right-4 bottom-3.5 pointer-events-none text-primary-400 text-xs">▼</div>}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Iftar Countdown */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-900/60 to-primary-800/60 backdrop-blur-md rounded-app-lg border border-accent-500/20 p-8 shadow-glass group hover:border-accent-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-32 bg-accent-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="text-center relative z-10">
                        <span className="text-6xl mb-6 block drop-shadow-lg filter brightness-110">🌙</span>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('timeUntilIftar')}</h2>
                        <div className="text-5xl md:text-6xl font-bold text-accent-400 my-6 font-mono tracking-wider drop-shadow-md">
                            {timeLeftIftar}
                        </div>
                        <div className="inline-block px-6 py-3 bg-primary-950/50 rounded-xl border border-white/5">
                            <p className="text-primary-200 flex items-center gap-3">
                                <span className="uppercase text-xs font-bold tracking-widest">{t('iftarTime')}</span>
                                <span className="font-heading font-bold text-white text-2xl">{prayerTimes?.Maghrib || '--:--'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sehri Countdown */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-900/60 to-primary-800/60 backdrop-blur-md rounded-app-lg border border-primary-400/20 p-8 shadow-glass group hover:border-primary-400/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="text-center relative z-10">
                        <span className="text-6xl mb-6 block drop-shadow-lg filter brightness-110">☀️</span>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('timeUntilSehri')}</h2>
                        <div className="text-5xl md:text-6xl font-bold text-primary-200 my-6 font-mono tracking-wider drop-shadow-md">
                            {timeLeftSehri}
                        </div>
                        <div className="inline-block px-6 py-3 bg-primary-950/50 rounded-xl border border-white/5">
                            <p className="text-primary-200 flex items-center gap-3">
                                <span className="uppercase text-xs font-bold tracking-widest">{t('sehriTime')}</span>
                                <span className="font-heading font-bold text-white text-2xl">{prayerTimes?.Fajr || '--:--'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-primary-500/50">
                Calculation Method: {getCalculationMethod(location.country) === 1 ? 'Karachi (18°)' : 'Standard (ISNA/MWL)'} based on {location.country}. <br />
                Hijri date adjusts at Maghrib.
            </div>
        </div>
    );
}
