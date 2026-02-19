'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { countries, commonCities } from '@/lib/locations';

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
        date: {
            readable: string;
            gregorian: {
                date: string;
            };
            hijri: {
                date: string;
                month: {
                    en: string;
                };
            };
        };
    };
    code: number;
}

export default function PrayerTimesClient() {
    const t = useTranslations('PrayerTimes');
    const format = useFormatter();

    // Time Format State
    const [is24Hour, setIs24Hour] = useState(false);

    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effective Location (used for fetching)
    const [location, setLocation] = useState<{
        city: string;
        country: string;
        lat?: number;
        lng?: number;
        useCoords?: boolean;
    }>({ city: 'Dhaka', country: 'Bangladesh', useCoords: false });

    // Input States
    const [cityInput, setCityInput] = useState('Dhaka');
    const [hijriDate, setHijriDate] = useState('');

    // City suggestions
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Initial load from profile
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) { console.warn('Profile not JSON'); return; }

                if (data.success && data.data?.cityName) {
                    const profileCity = data.data.cityName;
                    const profileCountry = data.data.countryName || 'Bangladesh';

                    setCityInput(profileCity);
                    setLocation(prev => ({
                        ...prev,
                        city: profileCity,
                        country: profileCountry,
                        useCoords: false
                    }));
                }
            } catch (e) {
                console.error('Failed to load profile location', e);
            }
        };
        loadProfile();
    }, []);

    // Update suggestions when country changes
    useEffect(() => {
        if (commonCities[location.country]) {
            setCitySuggestions(commonCities[location.country]);
        } else {
            setCitySuggestions([]);
        }
    }, [location.country]);

    // Fetch only when effective location changes
    useEffect(() => {
        fetchPrayerTimes();
    }, [location]);

    const fetchPrayerTimes = async () => {
        try {
            setLoading(true);
            setError(null);

            let url = '';
            if (location.useCoords && location.lat && location.lng) {
                url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${location.lat}&longitude=${location.lng}&method=1`;
            } else {
                const cleanCity = location.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const cleanCountry = location.country.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                url = `https://api.aladhan.com/v1/timingsByCity?city=${cleanCity}&country=${cleanCountry}&method=1`;
            }

            const response = await fetch(url);
            const data: AladhanResponse = await response.json();

            if (data.code !== 200) {
                throw new Error(t('error'));
            }

            setPrayerTimes(data.data.timings);
            setHijriDate(`${data.data.date.hijri.date} ${data.data.date.hijri.month.en}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        if (is24Hour) return time;

        // Convert to 12h
        const [hourStr, minStr] = time.split(':');
        let hour = parseInt(hourStr);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12; // the hour '0' should be '12'
        return `${hour}:${minStr} ${ampm}`;
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

    return (
        <div className="w-full">
            {/* Location Selector */}
            {/* Location Selection Section */}
            <div className="bg-primary-900/40 backdrop-blur-md border border-white/10 rounded-app-lg p-6 md:p-8 shadow-glass mb-12">
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <h3 className="text-primary-200 text-sm font-medium flex items-center gap-2">
                        <span className="text-accent-400 text-lg">📍</span>
                        {t('yourLocation')}: <span className="text-white font-bold ml-1">{location.city}, {location.country}</span>
                    </h3>

                    <div className="flex bg-primary-950/50 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setIs24Hour(false)}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${!is24Hour
                                ? 'bg-accent-600 text-white shadow-sm'
                                : 'text-primary-400 hover:text-white'
                                }`}
                        >
                            12H
                        </button>
                        <button
                            onClick={() => setIs24Hour(true)}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${is24Hour
                                ? 'bg-accent-600 text-white shadow-sm'
                                : 'text-primary-400 hover:text-white'
                                }`}
                        >
                            24H
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-end">
                    {/* Country Selector */}
                    <div className="relative group w-full">
                        <label className="text-xs text-primary-300 font-semibold mb-2 block uppercase tracking-wider">{t('country')}</label>
                        <select
                            value={location.country}
                            onChange={(e) => {
                                const newCountry = e.target.value;
                                const newCity = commonCities[newCountry] ? commonCities[newCountry][0] : '';
                                setLocation(prev => ({ ...prev, country: newCountry, city: newCity, useCoords: false }));
                                setCityInput(newCity);
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 appearance-none cursor-pointer transition-colors hover:bg-primary-950/70"
                        >
                            {countries.map((c) => (
                                <option key={c} value={c} className="bg-primary-900 text-white">{c}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 bottom-3.5 pointer-events-none text-primary-400 text-xs">▼</div>
                    </div>

                    {/* City Input/Selector */}
                    <div className="relative group w-full">
                        <label className="text-xs text-primary-300 font-semibold mb-2 block uppercase tracking-wider">{t('city')}</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={cityInput}
                                onChange={(e) => {
                                    setCityInput(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleManualSubmit();
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="w-full px-4 py-3 rounded-xl bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 placeholder:text-primary-400 transition-colors hover:bg-primary-950/70"
                                placeholder={t('enterCity')}
                            />
                            {/* Search Button */}
                            <button
                                onClick={handleManualSubmit}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary-400 hover:text-white"
                            >
                                🔍
                            </button>

                            {showSuggestions && citySuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-primary-900 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto backdrop-blur-xl">
                                    {citySuggestions.filter(c => c.toLowerCase().includes(cityInput.toLowerCase())).map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => handleCitySelect(suggestion)}
                                            className="w-full text-left px-4 py-3 text-primary-100 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
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
                                        alert('Error getting location: ' + error.message);
                                        setLoading(false);
                                    }
                                );
                            } else {
                                alert('Geolocation is not supported by this browser.');
                            }
                        }}
                        disabled={loading}
                        className="w-full md:w-auto px-6 py-3 bg-accent-600 text-white rounded-xl hover:bg-accent-500 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <>
                                📍<span>{t('useMyLocation')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Prayer Times Card */}
            <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass p-8 relative z-10 overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {t('title')}
                    </h2>
                    <p className="text-primary-200 text-lg">
                        {location.useCoords ? t('yourLocation') : `${location.city}, ${location.country}`}
                    </p>
                    {hijriDate && (
                        <div className="inline-block mt-3 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-accent-300 text-sm font-medium">
                            🌙 {hijriDate} (Hijri)
                        </div>
                    )}
                    <p className="text-primary-400 text-sm mt-2">
                        {format.dateTime(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-500 border-t-transparent"></div>
                        <p className="text-primary-200 mt-4 animate-pulse">{t('loading')}...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                        <p className="text-red-300 mb-4">❌ {error}</p>
                        <button
                            onClick={fetchPrayerTimes}
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg transition border border-red-500/30"
                        >
                            {t('retry')}
                        </button>
                    </div>
                )}

                {!loading && !error && prayerTimes && (
                    <div className="grid gap-3 relative z-10">
                        {Object.entries(prayerTimes).map(([name, time], idx) => (
                            <div
                                key={name}
                                className="flex justify-between items-center p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 group border border-white/5 hover:border-accent-500/30 hover:scale-[1.01] hover:shadow-lg"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-800 to-primary-700 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                                        {name === 'Fajr' && '🌅'}
                                        {name === 'Sunrise' && '☀️'}
                                        {name === 'Dhuhr' && '🌞'}
                                        {name === 'Asr' && '🌤️'}
                                        {name === 'Maghrib' && '🌇'}
                                        {name === 'Isha' && '🌙'}
                                    </div>
                                    <span className="text-xl font-bold text-white tracking-wide">{name}</span>
                                </div>
                                <span className="text-2xl font-mono font-bold text-accent-400 group-hover:text-accent-300 transition-colors bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                                    {formatTime(time as string)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-primary-400 text-sm">
                        {t('calculationMethod')} • University of Islamic Sciences, Karachi
                    </p>
                </div>
            </div>

            {/* Quick Actions / Summary */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-md rounded-app-lg border border-indigo-500/20 shadow-glass p-6 text-center group hover:scale-[1.02] transition-all duration-300">
                    <span className="text-5xl block mb-4 filter drop-shadow-md group-hover:scale-110 transition-transform duration-500">🌅</span>
                    <h3 className="text-indigo-100 font-bold mb-1 text-lg">{t('nextIftar')}</h3>
                    <p className="text-3xl font-bold text-white mt-2 font-mono">
                        {formatTime(prayerTimes?.Maghrib as string || '') || '--:--'}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-md rounded-app-lg border border-purple-500/20 shadow-glass p-6 text-center group hover:scale-[1.02] transition-all duration-300">
                    <span className="text-5xl block mb-4 filter drop-shadow-md group-hover:scale-110 transition-transform duration-500">🌙</span>
                    <h3 className="text-purple-100 font-bold mb-1 text-lg">{t('sehriEnds')}</h3>
                    <p className="text-3xl font-bold text-white mt-2 font-mono">
                        {formatTime(prayerTimes?.Fajr as string || '') || '--:--'}
                    </p>
                </div>
            </div>
        </div>
    );
}
