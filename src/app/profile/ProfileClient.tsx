'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllCountries, getCitiesOfCountry } from '@/lib/locations-package';

export default function ProfileClient({ user }: { user: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Form State
    const [name, setName] = useState(user.name || '');
    const [anonymousName, setAnonymousName] = useState('');

    // Location Data
    const allCountries = useMemo(() => getAllCountries(), []);
    const [cities, setCities] = useState<{ name: string }[]>([]);

    // Selection State
    const [selectedCountryCode, setSelectedCountryCode] = useState('');
    const [countryName, setCountryName] = useState(user.countryName || 'Bangladesh');
    const [cityName, setCityName] = useState(user.cityName || 'Dhaka');

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                // Fetch User Profile (to get current location)
                const profileRes = await fetch('/api/user/profile');
                if (!profileRes.ok) {
                    console.error('Profile API failed:', profileRes.status);
                    return;
                }
                const profileData = await profileRes.json();

                if (profileData.success) {
                    const u = profileData.data;
                    setName(u.name);
                    setAnonymousName(u.anonymousName || '');

                    const uCountry = u.countryName || 'Bangladesh';
                    const uCity = u.cityName || 'Dhaka';

                    setCountryName(uCountry);
                    setCityName(uCity);

                    // Find code for the saved country name
                    const foundCountry = allCountries.find(c => c.name === uCountry);
                    if (foundCountry) {
                        setSelectedCountryCode(foundCountry.isoCode);
                    } else {
                        // Fallback to Bangladesh if not found or empty
                        const bd = allCountries.find(c => c.name === 'Bangladesh');
                        if (bd) setSelectedCountryCode(bd.isoCode);
                    }
                }
            } catch (error) {
                console.error('Error initializing profile:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [allCountries]);

    // Update cities when country code changes
    useEffect(() => {
        if (selectedCountryCode) {
            const countryCities = getCitiesOfCountry(selectedCountryCode);
            setCities(countryCities);

            // Check if current cityName exists in new list, if not, reset (unless it's initial load)
            // But for initial load, we want to keep it. 
            // Better logic: If the list is not empty and current cityName is not in it, reset?
            // Actually, if we just switched country, we should reset.
            // But this effect runs on mount too after setting code.
            // We can check if `cities` was already populated? No.
            // Let's rely on user interaction to reset.
        } else {
            setCities([]);
        }
    }, [selectedCountryCode]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        const countryObj = allCountries.find(c => c.isoCode === newCode);

        setSelectedCountryCode(newCode);
        setCountryName(countryObj ? countryObj.name : '');
        setCityName(''); // Reset city on country change
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    countryName,
                    cityName,
                    language: user.preferredLanguage
                }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage('Profile updated successfully! ✅');
                setTimeout(() => setMessage(''), 3000);
                router.refresh();
            } else {
                setMessage('Failed to update profile. ❌');
            }
        } catch (error) {
            setMessage('An error occurred. ❌');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white text-center py-20">Loading profile...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/"
                    className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
                >
                    ← Back
                </Link>
                <h1 className="text-3xl font-bold text-white">My Profile 👤</h1>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-center ${message.includes('✅') ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-primary-200 mb-2 font-semibold">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent"
                            placeholder="Your Name"
                        />
                        <p className="text-primary-300 text-sm mt-2">
                            🔒 Others will see you as: <span className="text-accent font-semibold">{anonymousName}</span> in the leaderboard.
                        </p>
                    </div>

                    {/* Location Section */}
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-xl font-bold text-white mb-4">📍 Location Settings</h3>
                        <p className="text-primary-300 text-sm mb-6">
                            Select your country and city to customize your experience.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Country */}
                            <div>
                                <label className="block text-primary-200 mb-2">Country</label>
                                <select
                                    value={selectedCountryCode}
                                    onChange={handleCountryChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent [&>option]:bg-primary-900"
                                >
                                    <option value="">Select Country</option>
                                    {allCountries.map((c) => (
                                        <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-primary-200 mb-2">City</label>
                                {cities.length > 0 ? (
                                    <select
                                        value={cityName}
                                        onChange={(e) => setCityName(e.target.value)}
                                        disabled={!selectedCountryCode}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent disabled:opacity-50 [&>option]:bg-primary-900"
                                    >
                                        <option value="">Select City</option>
                                        {cities.map((city) => (
                                            <option key={city.name} value={city.name}>{city.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={cityName}
                                        onChange={(e) => setCityName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent"
                                        placeholder="Enter City Name"
                                    />
                                )}
                                {cities.length === 0 && selectedCountryCode && (
                                    <p className="text-xs text-primary-300 mt-1">No cities found for this country, please type manually.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent/80 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
