'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { User } from 'next-auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { countries, commonCities } from '@/lib/locations';
import { toast } from 'sonner';

interface ProfileClientProps {
    user: User;
    locale: string;
}

export default function ProfileClient({ user, locale }: ProfileClientProps) {
    const t = useTranslations('Profile');

    // State
    const [country, setCountry] = useState('Bangladesh');
    const [city, setCity] = useState('');
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load
    useEffect(() => {
        // @ts-ignore - existing properties
        if (user.countryName) setCountry(user.countryName);
        // @ts-ignore - existing properties
        if (user.cityName) setCity(user.cityName);

        // Fetch fresh profile data to be sure
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    if (data.data.countryName) setCountry(data.data.countryName);
                    if (data.data.cityName) setCity(data.data.cityName);
                }
            })
            .catch(console.error);
    }, [user]);

    // Update suggestions
    useEffect(() => {
        if (commonCities[country]) {
            setCitySuggestions(commonCities[country]);
        } else {
            setCitySuggestions([]);
        }
    }, [country]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ countryName: country, cityName: city })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Profile updated successfully!');
            } else {
                toast.error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary-950 text-white selection:bg-accent-500 selection:text-white flex flex-col">
            <Navbar session={{ user }} locale={locale} />

            <main className="flex-grow pt-24 pb-12 px-4 max-w-4xl mx-auto w-full">
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
                    <div className="bg-primary-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm shadow-glass">
                        <div className="w-24 h-24 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold shadow-gold-glow">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
                        <p className="text-primary-300 mb-6">{user.email}</p>

                        <div className="text-left mt-8 border-t border-white/10 pt-6">
                            <h3 className="text-xl font-semibold mb-4 text-accent-300">{t('locationSettings')}</h3>
                            <p className="text-primary-400 text-sm mb-6">{t('locationDesc')}</p>

                            <div className="grid md:grid-cols-2 gap-6 items-end bg-primary-800/30 p-6 rounded-xl border border-white/5">
                                {/* Country Selector */}
                                <div className="relative group w-full">
                                    <label className="text-xs text-primary-300 font-semibold mb-2 block uppercase tracking-wider">Country</label>
                                    <select
                                        value={country}
                                        onChange={(e) => {
                                            const newCountry = e.target.value;
                                            setCountry(newCountry);
                                            // Auto-select first city if available
                                            if (commonCities[newCountry] && commonCities[newCountry].length > 0) {
                                                setCity(commonCities[newCountry][0]);
                                            } else {
                                                setCity('');
                                            }
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 appearance-none cursor-pointer transition-colors hover:bg-primary-950/70"
                                    >
                                        {countries.map((c) => (
                                            <option key={c} value={c} className="bg-primary-900 text-white">{c}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 bottom-3.5 pointer-events-none text-primary-400 text-xs">▼</div>
                                </div>

                                {/* City Input */}
                                <div className="relative group w-full">
                                    <label className="text-xs text-primary-300 font-semibold mb-2 block uppercase tracking-wider">City</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => {
                                                setCity(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            className="w-full px-4 py-3 rounded-xl bg-primary-800 text-white border border-white/10 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 placeholder:text-primary-400 transition-colors hover:bg-primary-950/70"
                                            placeholder="Enter your city"
                                        />
                                        {showSuggestions && citySuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-primary-900 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto backdrop-blur-xl">
                                                {citySuggestions.filter(c => c.toLowerCase().includes(city.toLowerCase())).map((suggestion) => (
                                                    <button
                                                        key={suggestion}
                                                        type="button"
                                                        onClick={() => {
                                                            setCity(suggestion);
                                                            setShowSuggestions(false);
                                                        }}
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

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <a href="/api/auth/signout" className="inline-block px-6 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 rounded-lg transition-colors border border-red-500/30">
                                Sign Out
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <Footer language={locale} />
        </div>
    );
}
