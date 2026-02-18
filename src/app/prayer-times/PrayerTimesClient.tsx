'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{
        city: string;
        country: string;
        lat?: number;
        lng?: number;
        useCoords?: boolean;
    }>({ city: 'Dhaka', country: 'Bangladesh', useCoords: false });
    const [hijriDate, setHijriDate] = useState('');

    // City suggestions
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Initial load from profile
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                const data = await res.json();
                if (data.success && data.data?.cityName) {
                    setLocation(prev => ({
                        ...prev,
                        city: data.data.cityName,
                        country: data.data.countryName || 'Bangladesh',
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
                throw new Error('Failed to fetch prayer times. Check city/country.');
            }

            setPrayerTimes(data.data.timings);
            setHijriDate(`${data.data.date.hijri.date} ${data.data.date.hijri.month.en}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Location Selector */}
            <div className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                <label className="block text-white font-semibold mb-3">
                    📍 your Location:
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Country Selector */}
                    <select
                        value={location.country}
                        onChange={(e) => {
                            const newCountry = e.target.value;
                            const newCity = commonCities[newCountry] ? commonCities[newCountry][0] : '';
                            setLocation({ ...location, country: newCountry, city: newCity, useCoords: false });
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent [&>option]:bg-primary-900"
                    >
                        {countries.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* City Input/Selector */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={location.city}
                            onChange={(e) => {
                                setLocation({ ...location, city: e.target.value, useCoords: false });
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent placeholder-white/50"
                            placeholder="Enter City"
                        />
                        {showSuggestions && citySuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-primary-900 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {citySuggestions.filter(c => c.toLowerCase().includes(location.city.toLowerCase())).map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                            setLocation({ ...location, city: suggestion, useCoords: false });
                                            setShowSuggestions(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition"
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
                                    },
                                    (error) => {
                                        if (error.code === error.PERMISSION_DENIED) {
                                            alert('Location access denied. Please enable location permissions.');
                                        } else {
                                            alert('Error getting location: ' + error.message);
                                        }
                                        setLoading(false);
                                    }
                                );
                            } else {
                                alert('Geolocation is not supported by this browser.');
                            }
                        }}
                        className="px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/80 transition flex items-center gap-2 font-medium whitespace-nowrap justify-center"
                        title="Use My Exact Location"
                    >
                        📍 Use My Location
                    </button>
                </div>
            </div>

            {/* Prayer Times Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Today's Prayer Times
                    </h2>
                    <p className="text-primary-200">
                        {location.useCoords ? '📍 Your Exact Location' : `${location.city}, ${location.country}`}
                    </p>
                    {hijriDate && (
                        <p className="text-accent text-sm mt-1">
                            {hijriDate} (Hijri)
                        </p>
                    )}
                    <p className="text-primary-300 text-sm">
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                </div>

                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
                        <p className="text-white mt-4">Loading prayer times...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
                        <p className="text-red-200">❌ {error}</p>
                        <button
                            onClick={fetchPrayerTimes}
                            className="mt-3 px-6 py-2 bg-accent rounded-lg text-white hover:bg-accent/80 transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && prayerTimes && (
                    <div className="space-y-3">
                        {Object.entries(prayerTimes).map(([name, time]) => (
                            <div
                                key={name}
                                className="flex justify-between items-center p-5 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 group"
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
                                    <span className="text-xl font-semibold text-white">{name}</span>
                                </div>
                                <span className="text-2xl font-bold text-accent group-hover:scale-110 transition-transform">
                                    {time}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-primary-300 text-sm">
                        Prayer times calculated using Islamic Society of North America (ISNA) method
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-accent/20 to-secondary/20 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
                    <span className="text-4xl block mb-2">🌅</span>
                    <h3 className="text-white font-semibold mb-1">Next: Iftar Time</h3>
                    <p className="text-primary-200 text-sm">
                        {prayerTimes?.Maghrib || '--:--'}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
                    <span className="text-4xl block mb-2">🌙</span>
                    <h3 className="text-white font-semibold mb-1">Sehri Ends At</h3>
                    <p className="text-primary-200 text-sm">
                        {prayerTimes?.Fajr || '--:--'}
                    </p>
                </div>
            </div>
        </div>
    );
}
