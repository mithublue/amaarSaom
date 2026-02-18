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
                url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${location.lat}&longitude=${location.lng}&method=2`;
            } else {
                const cleanCity = location.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const cleanCountry = location.country.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                url = `https://api.aladhan.com/v1/timingsByCity?city=${cleanCity}&country=${cleanCountry}&method=2`;
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
        <div className="max-w-4xl mx-auto">
            {/* Location Selector */}
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative z-10">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-primary-900 font-semibold">
                        {t('yourLocation')}
                    </label>

                    {/* Time Format Toggle */}
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setIs24Hour(false)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${!is24Hour ? 'bg-white text-primary-900 shadow-sm' : 'text-text-secondary hover:text-primary-900'}`}
                        >
                            12H
                        </button>
                        <button
                            onClick={() => setIs24Hour(true)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${is24Hour ? 'bg-white text-primary-900 shadow-sm' : 'text-text-secondary hover:text-primary-900'}`}
                        >
                            24H
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Country Selector */}
                    <select
                        value={location.country}
                        onChange={(e) => {
                            const newCountry = e.target.value;
                            const newCity = commonCities[newCountry] ? commonCities[newCountry][0] : '';
                            setLocation(prev => ({ ...prev, country: newCountry, city: newCity, useCoords: false }));
                            setCityInput(newCity);
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-50 text-primary-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        {countries.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* City Input/Selector */}
                    <div className="relative flex-1">
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
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 text-primary-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent placeholder-text-muted"
                            placeholder={t('enterCity')}
                        />
                        {/* Search Button (Visible on mobile or if needed, but Enter works) */}
                        <button
                            onClick={handleManualSubmit}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-primary-900"
                        >
                            🔍
                        </button>

                        {showSuggestions && citySuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {citySuggestions.filter(c => c.toLowerCase().includes(cityInput.toLowerCase())).map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => handleCitySelect(suggestion)}
                                        className="w-full text-left px-4 py-2 text-primary-900 hover:bg-slate-50 transition"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

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
                        className="px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/80 transition flex items-center gap-2 font-medium whitespace-nowrap justify-center shadow-md"
                        title="Use My Exact Location"
                    >
                        {t('useMyLocation')}
                    </button>
                </div>
            </div>

            {/* Prayer Times Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 relative z-0">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-primary-900 mb-2">
                        {t('title')}
                    </h2>
                    <p className="text-text-secondary">
                        {location.useCoords ? t('yourLocation') : `${location.city}, ${location.country}`}
                    </p>
                    {hijriDate && (
                        <p className="text-accent text-sm mt-1">
                            {hijriDate} (Hijri)
                        </p>
                    )}
                    <p className="text-text-muted text-sm">
                        {format.dateTime(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
                        <p className="text-primary-600 mt-4">{t('loading')}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <p className="text-red-600">❌ {error}</p>
                        <button
                            onClick={fetchPrayerTimes}
                            className="mt-3 px-6 py-2 bg-accent rounded-lg text-white hover:bg-accent/80 transition"
                        >
                            {t('retry')}
                        </button>
                    </div>
                )}

                {!loading && !error && prayerTimes && (
                    <div className="space-y-3">
                        {Object.entries(prayerTimes).map(([name, time]) => (
                            <div
                                key={name}
                                className="flex justify-between items-center p-5 bg-slate-50/50 rounded-xl hover:bg-slate-100 transition-all duration-200 group border border-transparent hover:border-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">
                                        {name === 'Fajr' && '🌅'}
                                        {name === 'Sunrise' && '☀️'}
                                        {name === 'Dhuhr' && '🌞'}
                                        {name === 'Asr' && '🌤️'}
                                        {name === 'Maghrib' && '🌇'}
                                        {name === 'Isha' && '🌙'}
                                    </span>
                                    <span className="text-xl font-semibold text-primary-900">{name}</span>
                                </div>
                                <span className="text-2xl font-bold text-accent group-hover:scale-110 transition-transform">
                                    {formatTime(time as string)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <p className="text-text-muted text-sm">
                        {t('calculationMethod')}
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition">
                    <span className="text-4xl block mb-2">🌅</span>
                    <h3 className="text-primary-900 font-semibold mb-1">{t('nextIftar')}</h3>
                    <p className="text-text-secondary text-sm">
                        {formatTime(prayerTimes?.Maghrib as string || '') || '--:--'}
                    </p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center hover:shadow-md transition">
                    <span className="text-4xl block mb-2">🌙</span>
                    <h3 className="text-primary-900 font-semibold mb-1">{t('sehriEnds')}</h3>
                    <p className="text-text-secondary text-sm">
                        {formatTime(prayerTimes?.Fajr as string || '') || '--:--'}
                    </p>
                </div>
            </div>
        </div>
    );
}
