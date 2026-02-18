'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllCountries, getCitiesOfCountry } from '@/lib/locations-package';

export default function IftarSehriClient() {
    const [timeLeftIftar, setTimeLeftIftar] = useState<string>('--:--:--');
    const [timeLeftSehri, setTimeLeftSehri] = useState<string>('--:--:--');
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
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

    // Load initial profile data
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                const text = await res.text();

                let responseData;
                try {
                    responseData = JSON.parse(text);
                } catch (e) {
                    // Response was not JSON (likely HTML error page or login redirect)
                    console.warn('Profile response was not JSON:', text.substring(0, 50) + '...');
                    return;
                }

                if (responseData && responseData.success && responseData.data?.cityName) {
                    const uCountry = responseData.data.countryName || 'Bangladesh';
                    setLocation(prev => ({
                        ...prev,
                        city: responseData.data.cityName,
                        country: uCountry,
                        useCoords: false
                    }));

                    // Find code for the saved country name
                    const foundCountry = allCountries.find(c => c.name === uCountry);
                    if (foundCountry) {
                        setSelectedCountryCode(foundCountry.isoCode);
                    } else {
                        const bd = allCountries.find(c => c.name === 'Bangladesh');
                        if (bd) setSelectedCountryCode(bd.isoCode);
                    }
                }
            } catch (e) {
                console.error('Failed to load profile (using defaults)', e);
            }
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

    // Fetch Times Wrapper
    const fetchTimes = useCallback(async () => {
        try {
            setLoading(true);
            let url = '';
            // If using coords, use them. Otherwise fallback to City/Country
            if (location.useCoords && location.lat && location.lng) {
                url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${location.lat}&longitude=${location.lng}&method=2`;
            } else if (location.city && location.country) {
                // Sanitize names (remove accents/diacritics) for API
                // e.g. "Cox's Bāzār" -> "Cox's Bazar"
                const cleanCity = location.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const cleanCountry = location.country.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(cleanCity)}&country=${encodeURIComponent(cleanCountry)}&method=2`;
            } else {
                setLoading(false);
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
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [location]);

    useEffect(() => {
        fetchTimes();
    }, [fetchTimes]);

    // Timer Logic
    const calculateTimeLeft = useCallback(() => {
        if (!prayerTimes) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const maghribTime = new Date(`${todayStr}T${prayerTimes.Maghrib}:00`);
        const fajrTime = new Date(`${todayStr}T${prayerTimes.Fajr}:00`);

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

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        const countryObj = allCountries.find(c => c.isoCode === newCode);
        const newCountryName = countryObj ? countryObj.name : '';

        setSelectedCountryCode(newCode);
        setLocation({ ...location, country: newCountryName, city: '', useCoords: false });
    };

    const getDisplayLocation = () => {
        if (location.useCoords) return '📍 Your Exact Location';
        if (location.city && location.country) return `${location.city}, ${location.country}`;
        if (location.country) return `${location.country}`;
        return 'Select Location';
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between mb-4">
                    <p className="text-primary-200 text-sm">Location set to: <span className="text-white font-bold">{getDisplayLocation()}</span></p>

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
                        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition text-sm flex items-center gap-2"
                    >
                        📍 Find time in my location
                    </button>
                </div>

                {/* Dropdowns */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="text-xs text-primary-300 mb-1 block ml-1">Country</label>
                        <select
                            value={selectedCountryCode}
                            onChange={handleCountryChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent [&>option]:bg-primary-900 appearance-none cursor-pointer"
                        >
                            <option value="">Select Country</option>
                            {allCountries.map((c) => (
                                <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <label className="text-xs text-primary-300 mb-1 block ml-1">City</label>
                        {cities.length > 0 ? (
                            <select
                                value={location.city}
                                onChange={(e) => setLocation({ ...location, city: e.target.value, useCoords: false })}
                                disabled={!selectedCountryCode}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent [&>option]:bg-primary-900 disabled:opacity-50 appearance-none cursor-pointer"
                            >
                                <option value="">Select City</option>
                                {cities.map((city) => (
                                    <option key={city.name} value={city.name}>{city.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={location.city}
                                onChange={(e) => setLocation({ ...location, city: e.target.value, useCoords: false })}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent placeholder-white/50"
                                placeholder={selectedCountryCode ? "Enter City Name" : "Select Country First"}
                                disabled={!selectedCountryCode}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Iftar Countdown */}
                <div className="bg-gradient-to-br from-secondary/20 to-accent/20 backdrop-blur-md rounded-3xl border border-white/20 p-8 transform hover:scale-105 transition duration-300">
                    <div className="text-center">
                        <span className="text-6xl mb-4 block">🌙</span>
                        <h2 className="text-2xl font-bold text-white mb-2">Time Until Iftar</h2>
                        <div className="text-5xl font-bold text-accent my-6 font-mono tracking-wider">
                            {timeLeftIftar}
                        </div>
                        <div className="inline-block px-4 py-2 bg-black/20 rounded-lg">
                            <p className="text-primary-100 flex items-center gap-2">
                                <span>Iftar Time:</span>
                                <span className="font-bold text-white text-xl">{prayerTimes?.Maghrib || '--:--'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sehri Countdown */}
                <div className="bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-md rounded-3xl border border-white/20 p-8 transform hover:scale-105 transition duration-300">
                    <div className="text-center">
                        <span className="text-6xl mb-4 block">☀️</span>
                        <h2 className="text-2xl font-bold text-white mb-2">Time Until Sehri Ends</h2>
                        <div className="text-5xl font-bold text-white my-6 font-mono tracking-wider">
                            {timeLeftSehri}
                        </div>
                        <div className="inline-block px-4 py-2 bg-black/20 rounded-lg">
                            <p className="text-primary-100 flex items-center gap-2">
                                <span>Sehri Ends:</span>
                                <span className="font-bold text-white text-xl">{prayerTimes?.Fajr || '--:--'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
