'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';
import { getAllCountries, getCitiesOfCountry } from '@/lib/locations-package';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default function ProfileClient({ user }: { user: any }) {
    const router = useRouter();
    const t = useTranslations('Profile');
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
                setMessage(t('success'));
                setTimeout(() => setMessage(''), 3000);
                router.refresh();
            } else {
                setMessage(t('error'));
            }
        } catch (error) {
            setMessage(t('genericError'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white text-center py-20">{t('loading')}</div>;

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-primary-100 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                >
                    <span>←</span> {t('back')}
                </Link>
                <h1 className="text-3xl font-heading font-bold text-white flex-1 drop-shadow-md">{t('title')}</h1>
                <LanguageSwitcher />
            </div>

            <div className="bg-primary-900/40 backdrop-blur-md border border-white/10 rounded-app-lg shadow-glass p-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-center border ${message.includes('✅') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-primary-200 mb-2 font-semibold">{t('displayName')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition shadow-sm placeholder:text-gray-400"
                            placeholder={t('placeholderName')}
                        />
                        <p className="text-primary-400 text-sm mt-2">
                            🔒 {t('anonymousInfo', { name: anonymousName })}
                        </p>
                    </div>

                    {/* Location Section */}
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-xl font-bold text-white mb-4">{t('locationSettings')}</h3>
                        <p className="text-primary-300 text-sm mb-6">
                            {t('locationDesc')}
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Country */}
                            <div>
                                <label className="block text-primary-300 mb-2">{t('country')}</label>
                                <select
                                    value={selectedCountryCode}
                                    onChange={handleCountryChange}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-400">{t('selectCountry')}</option>
                                    {allCountries.map((c) => (
                                        <option key={c.isoCode} value={c.isoCode} className="text-black">{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-primary-300 mb-2">{t('city')}</label>
                                {cities.length > 0 ? (
                                    <select
                                        value={cityName}
                                        onChange={(e) => setCityName(e.target.value)}
                                        disabled={!selectedCountryCode}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition shadow-sm disabled:opacity-50 appearance-none cursor-pointer"
                                    >
                                        <option value="" className="text-gray-400">{t('selectCity')}</option>
                                        {cities.map((city) => (
                                            <option key={city.name} value={city.name} className="text-black">{city.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={cityName}
                                        onChange={(e) => setCityName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-black focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 transition shadow-sm placeholder:text-gray-400"
                                        placeholder={t('enterCity')}
                                    />
                                )}
                                {cities.length === 0 && selectedCountryCode && (
                                    <p className="text-xs text-primary-400 mt-1">{t('noCities')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-linear-to-r from-accent-600 to-accent-500 text-white py-4 rounded-xl font-bold text-lg hover:from-accent-500 hover:to-accent-400 transition disabled:opacity-50 shadow-gold-glow hover:shadow-lg hover:scale-[1.01]"
                        >
                            {saving ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
