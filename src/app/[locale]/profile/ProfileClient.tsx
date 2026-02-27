'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { User } from 'next-auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { countries, commonCities } from '@/lib/locations';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { calculateUserLevel, getNextLevel } from '@/lib/gamification';

// Lazy load the notification panel (uses Firebase client which needs browser)
const NotificationSettingsPanel = dynamic(() => import('./NotificationSettingsPanel'), { ssr: false });

type Tab = 'profile' | 'notifications' | 'referrals';

interface ProfileClientProps {
    user: User;
    locale: string;
}

export default function ProfileClient({ user, locale }: ProfileClientProps) {
    const t = useTranslations('Profile');
    const gT = useTranslations('Gamification');
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    // State
    const [country, setCountry] = useState('Bangladesh');
    const [city, setCity] = useState('');
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Initial load
    useEffect(() => {
        // @ts-ignore - existing properties
        if (user.countryName) setCountry(user.countryName);
        // @ts-ignore - existing properties
        if (user.cityName) setCity(user.cityName);

        fetch('/api/user/profile')
            .then(res => {
                if (res.status === 401 || res.status === 404) {
                    window.location.href = '/api/auth/signout';
                    throw new Error('User not found in database, logging out...');
                }
                return res.json();
            })
            .then(data => {
                if (data && data.success && data.data) {
                    setUserData(data.data);
                    if (data.data.countryName) setCountry(data.data.countryName);
                    if (data.data.cityName) setCity(data.data.cityName);
                }
            })
            .catch(console.error);
    }, [user]);

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
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary-950 text-white selection:bg-accent-500 selection:text-white flex flex-col">
            <Navbar session={{ user }} locale={locale} />

            <main className="flex-grow pt-24 pb-12 px-4 max-w-4xl mx-auto w-full">
                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>

                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-bold shadow-gold-glow">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                        <p className="text-primary-300 text-sm">{user.email}</p>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex rounded-xl bg-primary-900/40 border border-white/5 p-1 mb-8 max-w-lg mx-auto">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'bg-accent-700 text-white shadow' : 'text-primary-400 hover:text-white'}`}
                        >
                            👤 {t('title').replace('My Profile ', '').replace(' 👤', '') || 'Profile'}
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'notifications' ? 'bg-accent-700 text-white shadow' : 'text-primary-400 hover:text-white'}`}
                        >
                            🔔 Notifications
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/profile/referrals`)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'referrals' ? 'bg-accent-700 text-white shadow' : 'text-primary-400 hover:text-white'}`}
                        >
                            🎁 Referrals
                        </button>
                    </div>

                    {/* Gamification Stats */}
                    {isLoading && !userData ? (
                        <div className="mb-8 space-y-6 text-left animate-pulse">
                            {/* Skeleton Progress */}
                            <div className="bg-primary-900/50 p-6 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-white/10 rounded"></div>
                                        <div className="h-8 w-48 bg-white/10 rounded"></div>
                                    </div>
                                    <div className="space-y-2 flex flex-col items-end">
                                        <div className="h-4 w-32 bg-white/10 rounded"></div>
                                        <div className="h-6 w-20 bg-white/10 rounded"></div>
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-white/5 rounded-full mb-2"></div>
                                <div className="h-3 w-40 bg-white/10 rounded mx-auto mt-4"></div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Skeleton Akhirah */}
                                <div className="bg-primary-900/50 p-6 rounded-2xl border border-white/5 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0"></div>
                                    <div className="space-y-3 w-full">
                                        <div className="h-4 w-40 bg-white/10 rounded"></div>
                                        <div className="h-10 w-28 bg-white/10 rounded"></div>
                                    </div>
                                </div>

                                {/* Skeleton Trophy Room */}
                                <div className="bg-primary-900/50 p-6 rounded-2xl border border-white/5">
                                    <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="aspect-square rounded-xl bg-white/5"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : userData && (
                        <div className="mb-8 space-y-6 text-left animate-fade-in">
                            {/* Level Progress */}
                            {(() => {
                                const currentLevel = calculateUserLevel(userData.seasonPoints || 0);
                                const nextLevel = getNextLevel(currentLevel.level);
                                let progress = 100;
                                if (nextLevel) {
                                    const pointsInThisLevel = (userData.seasonPoints || 0) - currentLevel.minPoints;
                                    const levelRange = nextLevel.minPoints - currentLevel.minPoints;
                                    progress = Math.min(100, Math.max(0, (pointsInThisLevel / levelRange) * 100));
                                }

                                return (
                                    <div className="bg-primary-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-glass">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-sm text-primary-400 mb-1">{gT('currentLevel')}</p>
                                                <h3 className="text-2xl font-bold text-accent-400">
                                                    Level {currentLevel.level}: {gT(`levels.${currentLevel.nameKey}`)}
                                                </h3>
                                            </div>
                                            {nextLevel && (
                                                <div className="text-right">
                                                    <p className="text-xs text-primary-400 mb-1">{gT('nextLevel', { levelName: gT(`levels.${nextLevel.nameKey}`) })}</p>
                                                    <p className="text-sm font-bold bg-accent-500/10 text-accent-300 px-2 py-1 rounded inline-block">{(userData.seasonPoints || 0).toLocaleString()} <span className="text-[10px] font-normal opacity-70">/ {nextLevel.minPoints.toLocaleString()} pts</span></p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full h-3 bg-primary-950 rounded-full overflow-hidden mb-2 relative">
                                            <div
                                                className="h-full bg-gradient-to-r from-accent-600 to-accent-400 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                            {/* Sparkle effect on current progress tip */}
                                            {progress > 0 && progress < 100 && (
                                                <div
                                                    className="absolute top-0 bottom-0 w-2 bg-white/40 blur-[2px]"
                                                    style={{ left: `calc(${progress}% - 4px)` }}
                                                />
                                            )}
                                        </div>
                                        {nextLevel ? (
                                            <p className="text-xs text-primary-400 text-center">
                                                {gT('pointsToNext', { points: (nextLevel.minPoints - (userData.seasonPoints || 0)).toLocaleString() })}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-accent-400 text-center font-semibold">
                                                {gT('maxLevelReached')}
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Total Akhirah Savings */}
                                <div className="bg-gradient-to-br from-accent-950/80 to-primary-900/50 p-6 rounded-2xl border border-accent-500/20 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.05)] flex items-center gap-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 blur-[50px] rounded-full pointer-events-none" />
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-b from-accent-400 to-accent-600 flex flex-shrink-0 items-center justify-center text-white text-2xl shadow-lg relative z-10">
                                        💎
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs text-primary-300 font-semibold mb-1 uppercase tracking-widest">{gT('totalAkhirahSavings')}</p>
                                        <h4 className="text-4xl font-black text-white drop-shadow-md">
                                            {(userData.lifetimePoints || 0).toLocaleString()} <span className="text-sm font-semibold opacity-60">pts</span>
                                        </h4>
                                    </div>
                                </div>

                                {/* Trophy Room */}
                                <div className="bg-primary-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <h4 className="font-semibold text-primary-100 mb-4 flex items-center gap-2">
                                        🏆 {gT('trophyRoom')}
                                    </h4>
                                    {(!userData.trophies || userData.trophies.length === 0) ? (
                                        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-primary-950/30">
                                            <div className="text-4xl opacity-50 mb-2 grayscale">🏆</div>
                                            <p className="text-xs text-primary-400 uppercase tracking-widest font-semibold">No Trophies Yet</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                            {userData.trophies.map((trophy: any) => (
                                                <div key={trophy.id} className="text-center group relative cursor-help">
                                                    <div className="aspect-square rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/5 border border-yellow-500/30 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(234,179,8,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] group-hover:-translate-y-1 transition-all">
                                                        🏆
                                                    </div>
                                                    <p className="text-[10px] mt-2 text-primary-300 font-medium truncate">{trophy.monthName}</p>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-primary-950 border border-white/10 rounded-lg text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl">
                                                        <div className="font-semibold text-white mb-1">Level {trophy.level}: {gT(`levels.${trophy.level}`)}</div>
                                                        <div className="text-accent-400 font-bold">{trophy.points.toLocaleString()} pts</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab content */}
                    <div className="bg-primary-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-glass text-left">
                        {activeTab === 'profile' && (
                            <div>
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
                                                if (commonCities[newCountry]?.length > 0) {
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
                                                onChange={(e) => { setCity(e.target.value); setShowSuggestions(true); }}
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
                                                            onClick={() => { setCity(suggestion); setShowSuggestions(false); }}
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
                                        className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-accent-300">🔔 Notification Preferences</h3>
                                <p className="text-primary-400 text-sm mb-6">
                                    Manage how and when Nuzul notifies you. Prayer reminders and leaderboard motivation help you stay consistent.
                                </p>
                                <NotificationSettingsPanel />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-center">
                        <a href="/api/auth/signout" className="inline-block px-6 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 rounded-lg transition-colors border border-red-500/30">
                            Sign Out
                        </a>
                    </div>
                </div>
            </main>

            <Footer language={locale} />
        </div>
    );
}
