'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { useLocale, useTranslations } from 'next-intl';
import allHadiths from '@/app/api/json/hadiths.json';

interface HadithClientProps {
    initialHadith?: {
        text: string;
        source: string;
    }
}

interface Hadith {
    id: number;
    source: string;
    category: string;
    textEn: string;
    textBn: string;
    textAr: string;
}

export default function HadithClient({ initialHadith }: HadithClientProps) {
    const locale = useLocale();
    const t = useTranslations('Hadith');
    const [sharedPlatforms, setSharedPlatforms] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [hadithOfTheDay, setHadithOfTheDay] = useState<Hadith | null>(null);

    // Browsing State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [visibleCount, setVisibleCount] = useState(6);

    // Ramadan Start Date (Approximate for 2026 - User can configure this later)
    const RAMADAN_START_DATE = new Date('2026-02-18'); // Adjust as needed
    const today = new Date();

    // Calculate Day of Ramadan
    const diffTime = today.getTime() - RAMADAN_START_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const isRamadan = diffDays > 0 && diffDays <= 30;

    useEffect(() => {
        // Deterministic 'Random' Hadith based on Date
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        const index = dayOfYear % allHadiths.length;
        setHadithOfTheDay(allHadiths[index] as Hadith);
    }, []);

    const getLocalizedText = (h: Hadith) => {
        if (locale === 'bn') return h.textBn;
        if (locale === 'ar') return h.textAr;
        return h.textEn;
    };

    const currentHadithText = hadithOfTheDay ? getLocalizedText(hadithOfTheDay) : (initialHadith?.text || '');
    const currentHadithSource = hadithOfTheDay?.source || initialHadith?.source || '';

    // Filter Logic
    const filteredHadiths = useMemo(() => {
        return allHadiths.filter((h) => {
            const text = getLocalizedText(h as Hadith).toLowerCase();
            const source = h.source.toLowerCase();
            const query = searchQuery.toLowerCase();
            const matchesSearch = text.includes(query) || source.includes(query);
            const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory, locale]);

    const categories = ['All', ...Array.from(new Set(allHadiths.map(h => h.category)))];

    const generateImageBlob = async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#1a1c2e',
                scale: 2,
            });
            return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        } catch (error) {
            console.error('Error generating image blob:', error);
            return null;
        }
    };

    const handleDownloadImage = async () => {
        setLoading(true);
        const blob = await generateImageBlob();
        if (blob) {
            const link = document.createElement('a');
            link.download = `hadith-ramadan-companion.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            toast.success('Hadith image downloaded! 📸');
        } else {
            toast.error('Failed to generate image.');
        }
        setLoading(false);
    };

    const handleShare = async (platform: 'native' | 'twitter' | 'facebook' | 'email') => {
        setLoading(true);
        const textToShare = `"${currentHadithText}" — ${currentHadithSource}\n\nRead more on Ramadan Companion App! 🌙`;
        const url = window.location.href;

        // Try Native Share with Image first (Mobile/Compatiable Browsers)
        if (platform === 'native' && navigator.share) {
            const blob = await generateImageBlob();
            if (blob) {
                const file = new File([blob], 'hadith.png', { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'Daily Hadith',
                            text: textToShare,
                            files: [file],
                            url: url // Optional, some apps might prefer just image + text
                        });
                        toast.success('Shared successfully! 🌟');
                        // Award points logic here if needed
                        setLoading(false);
                        return;
                    } catch (err) {
                        console.warn('Native share failed or dismissed', err);
                        // Fallback to text share if image share fails
                    }
                }
            }
        }

        // Fallback to URL/Text sharing
        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}&url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(textToShare)}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=Hadith of the Day&body=${encodeURIComponent(textToShare)}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }

        // Award Points (once per platform)
        if (!sharedPlatforms.has(platform)) {
            try {
                const res = await fetch('/api/deeds/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customDeedName: `Shared Daily Hadith (${platform})`,
                        points: 10,
                        date: new Date().toISOString()
                    })
                });

                const data = await res.json();
                if (data.success) {
                    setSharedPlatforms(prev => new Set(prev).add(platform));
                    toast.success(`You earned 10 points for sharing! 🌟`);
                }
            } catch (error) {
                console.error('Error awarding points:', error);
            }
        }
        setLoading(false);
    };

    return (
        <div className="space-y-12 animate-fade-in mb-20">
            {/* Daily Hadith Card (The Hero) */}
            <div className={`bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass overflow-hidden`}>
                <div className="p-8 md:p-12">
                    <div className="text-center mb-10">
                        <div className="inline-block p-4 rounded-full bg-primary-800/20 border border-primary-500/30 mb-6 shadow-glow animate-float">
                            <span className="text-5xl">📖</span>
                        </div>
                        <h2 className="text-3xl font-heading font-bold text-white mb-2 tracking-tight drop-shadow-md">{t('title')}</h2>
                        <p className="text-primary-300 font-medium opacity-80 uppercase tracking-widest text-xs">
                            {isRamadan
                                ? `Day ${diffDays} of Ramadan`
                                : new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            }
                        </p>
                    </div>

                    <div
                        ref={cardRef}
                        className="bg-linear-to-br from-primary-950/80 to-primary-900/80 rounded-3xl p-10 mb-10 group relative overflow-hidden transition-all duration-500 border border-white/10 shadow-inner"
                    >
                        {/* Branding for Screenshot */}
                        <div className="absolute top-6 left-6 text-[10px] text-accent-500/40 font-black uppercase tracking-[0.3em] pointer-events-none select-none">
                            Ramadan Companion
                        </div>

                        <div className="absolute -right-12 -top-12 text-[12rem] opacity-[0.03] text-white font-serif pointer-events-none select-none">❝</div>
                        <div className="absolute -left-12 -bottom-12 text-[12rem] opacity-[0.03] text-white font-serif rotate-180 pointer-events-none select-none">❝</div>

                        <div className="relative z-10 py-6">
                            <p className="text-white text-2xl md:text-4xl leading-relaxed text-center mb-10 font-serif drop-shadow-sm select-all">
                                "{currentHadithText}"
                            </p>
                            <div className="w-24 h-1 bg-linear-to-r from-transparent via-accent-500 to-transparent mx-auto mb-6 rounded-full opacity-60"></div>
                            <p className="text-accent-300 text-sm md:text-lg text-center font-bold tracking-[0.15em] uppercase drop-shadow-sm">
                                — {currentHadithSource}
                            </p>
                        </div>
                    </div>

                    <div className="bg-primary-950/40 rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-6">
                        <div className="text-center">
                            <p className="text-accent-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
                                Reward: 10 Points
                            </p>
                            <p className="text-primary-300 text-sm font-medium opacity-70">Share this wisdom to inspire others and earn rewards.</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={handleDownloadImage}
                                className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all duration-300 border border-white/10 hover:border-accent-500/30"
                                title="Download Image"
                            >
                                <span className="text-xl group-hover:scale-125 group-hover:-translate-y-1 transition-transform inline-block">📸</span>
                                <span>Save Image</span>
                            </button>

                            <div className="h-10 w-px bg-white/5 mx-2 hidden md:block"></div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleShare('native')}
                                    className="p-3.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white transition-all duration-300 shadow-gold-glow hover:scale-110 active:scale-95"
                                    title="Share Highlight"
                                >
                                    <span className="text-xl">✨</span>
                                </button>
                                <button
                                    onClick={() => handleShare('twitter')}
                                    className={`p-3.5 rounded-xl transition-all duration-300 border ${sharedPlatforms.has('twitter') ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white hover:bg-[#1DA1F2] hover:border-[#1DA1F2] hover:shadow-lg hover:scale-110'}`}
                                    title="Share on Twitter"
                                    disabled={sharedPlatforms.has('twitter')}
                                >
                                    {sharedPlatforms.has('twitter') ? '✅' : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>}
                                </button>
                                <button
                                    onClick={() => handleShare('facebook')}
                                    className={`p-3.5 rounded-xl transition-all duration-300 border ${sharedPlatforms.has('facebook') ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white hover:bg-[#4267B2] hover:border-[#4267B2] hover:shadow-lg hover:scale-110'}`}
                                    title="Share on Facebook"
                                    disabled={sharedPlatforms.has('facebook')}
                                >
                                    {sharedPlatforms.has('facebook') ? '✅' : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}
                                </button>
                                <button
                                    onClick={() => handleShare('email')}
                                    className={`p-3.5 rounded-xl transition-all duration-300 border ${sharedPlatforms.has('email') ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white hover:bg-emerald-600 hover:border-emerald-600 hover:shadow-lg hover:scale-110'}`}
                                    title="Share via Email"
                                    disabled={sharedPlatforms.has('email')}
                                >
                                    {sharedPlatforms.has('email') ? '✅' : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Browse Section */}
            <div className="bg-primary-900/20 backdrop-blur-sm rounded-app-lg border border-white/5 p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8">
                    <div>
                        <h3 className="text-3xl font-heading font-bold text-white mb-2">{t('browseMore')}</h3>
                        <p className="text-primary-400 font-medium">Explore the vast wisdom of Prophetic narrations.</p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col xl:flex-row gap-6 mb-10">
                    <div className="relative flex-1 group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 group-focus-within:text-accent-400 transition-colors">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by keywords, source, or text..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-primary-950/40 border border-white/10 rounded-2xl text-white placeholder-primary-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/50 transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-4 xl:pb-0 scrollbar-hide no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all duration-300 ${selectedCategory === cat
                                    ? 'bg-accent-600 text-white shadow-gold-glow scale-[1.05]'
                                    : 'bg-white/5 text-primary-300 border border-white/5 hover:bg-white/10 hover:text-white'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hadiths Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredHadiths.slice(0, visibleCount).map((h) => (
                        <div key={h.id} className="bg-primary-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-primary-900/60 hover:border-accent-500/30 transition-all duration-500 group flex flex-col h-full shadow-glass animate-slide-up">
                            <div className="mb-6 flex justify-between items-start">
                                <span className="text-[10px] font-black text-accent-400 px-3 py-1 bg-accent-500/10 border border-accent-500/20 rounded-full uppercase tracking-widest group-hover:bg-accent-500/20 transition-colors">
                                    {h.category}
                                </span>
                                <span className="text-2xl opacity-20 group-hover:opacity-40 transition-opacity">❝</span>
                            </div>

                            <p className="text-white text-xl italic mb-8 font-serif leading-relaxed flex-grow group-hover:text-primary-50 transition-colors">
                                "{getLocalizedText(h as Hadith)}"
                            </p>

                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <p className="text-accent-300 text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                                    — {h.source}
                                </p>
                                <button className="text-white/20 hover:text-accent-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredHadiths.length === 0 && (
                    <div className="text-center py-24 bg-primary-950/20 rounded-3xl border border-dashed border-white/10">
                        <div className="text-7xl mb-6 opacity-20">🔍</div>
                        <h4 className="text-2xl font-bold text-white mb-2">No Hadiths Found</h4>
                        <p className="text-primary-400">Try adjusting your search terms or filter criteria.</p>
                    </div>
                )}

                {/* Load More Row */}
                {visibleCount < filteredHadiths.length && (
                    <div className="text-center mt-12">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 6)}
                            className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 hover:border-accent-500/30 transition-all duration-300 shadow-glass group"
                        >
                            <span className="flex items-center gap-2">
                                Load More Knowledge
                                <span className="group-hover:translate-y-1 transition-transform">↓</span>
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
