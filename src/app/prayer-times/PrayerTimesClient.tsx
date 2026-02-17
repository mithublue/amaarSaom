'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

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
}

export default function PrayerTimesClient() {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState({ city: 'Dhaka', country: 'Bangladesh' });
    const [hijriDate, setHijriDate] = useState('');

    useEffect(() => {
        fetchPrayerTimes();
    }, [location]);

    const fetchPrayerTimes = async () => {
        try {
            setLoading(true);
            setError(null);

            // Using Aladhan API with city and country
            const response = await fetch(
                `https://api.aladhan.com/v1/timingsByCity?city=${location.city}&country=${location.country}&method=2`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch prayer times');
            }

            const data: AladhanResponse = await response.json();
            setPrayerTimes(data.data.timings);
            setHijriDate(`${data.data.date.hijri.date} ${data.data.date.hijri.month.en}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const bangladeshCities = [
        'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Barishal',
        'Rangpur', 'Mymensingh', 'Comilla', 'Narayanganj'
    ];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Location Selector */}
            <div className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                <label className="block text-white font-semibold mb-3">
                    📍 Select Your City:
                </label>
                <select
                    value={location.city}
                    onChange={(e) => setLocation({ ...location, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                    {bangladeshCities.map((city) => (
                        <option key={city} value={city} className="bg-primary-800">
                            {city}
                        </option>
                    ))}
                </select>
            </div>

            {/* Prayer Times Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Today's Prayer Times
                    </h2>
                    <p className="text-primary-200">
                        {location.city}, {location.country}
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
