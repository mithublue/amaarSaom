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
        <div className="space-y-8">
            {/* Daily Hadith Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                <div className="text-center mb-6">
                    <span className="text-5xl block mb-4">📖</span>
                    <h2 className="text-2xl font-bold text-white mb-2">{t('title')}</h2>
                    <p className="text-primary-200 text-sm">
                        {isRamadan
                            ? `Day ${diffDays} of Ramadan`
                            : new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                        }
                    </p>
                </div>

                <div
                    ref={cardRef}
                    className="bg-white/5 rounded-2xl p-8 mb-8 group relative overflow-hidden transition-all hover:bg-white/10 border border-white/5"
                >
                    {/* Branding for Screenshot */}
                    <div className="absolute top-4 left-4 text-xs text-white/20 font-bold uppercase tracking-widest pointer-events-none">
                        Ramadan Companion
                    </div>

                    <div className="absolute -right-10 -top-10 text-9xl opacity-5 text-white">❝</div>
                    <p className="text-white text-xl md:text-2xl italic leading-relaxed text-center mb-6 font-serif relative z-10 pt-4">
                        "{currentHadithText}"
                    </p>
                    <div className="w-16 h-1 bg-accent/50 mx-auto mb-4 rounded-full"></div>
                    <p className="text-primary-200 text-sm md:text-base text-center font-semibold tracking-wide uppercase">
                        — {currentHadithSource}
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="text-center">
                        <p className="text-primary-300 text-sm mb-2">Share this beautiful message:</p>
                        <p className="text-accent text-xs font-semibold mb-4 bg-accent/10 px-3 py-1 rounded-full inline-block">
                            🎁 Reward: 10 Points (once per platform)
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleDownloadImage}
                            className="p-3 rounded-full transition-all text-white border border-white/10 bg-black/30 hover:bg-accent hover:scale-110"
                            title="Download Image"
                        >
                            <span className="text-xl">⬇️</span>
                        </button>
                        <button
                            onClick={() => handleShare('native')}
                            className="p-3 rounded-full transition-all text-white border border-white/10 bg-accent/20 hover:bg-accent hover:scale-110"
                            title="Share Highlight"
                        >
                            <span className="text-xl">✨</span> Share
                        </button>
                        <button
                            onClick={() => handleShare('twitter')}
                            className={`p-3 rounded-full transition-all text-white border border-white/10 ${sharedPlatforms.has('twitter') ? 'bg-green-600/50' : 'bg-black/30 hover:bg-[#1DA1F2] hover:scale-110'}`}
                            title="Share on Twitter"
                            disabled={sharedPlatforms.has('twitter')}
                        >
                            {sharedPlatforms.has('twitter') ? '✅' : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>}
                        </button>
                        <button
                            onClick={() => handleShare('facebook')}
                            className={`p-3 rounded-full transition-all text-white border border-white/10 ${sharedPlatforms.has('facebook') ? 'bg-green-600/50' : 'bg-black/30 hover:bg-[#4267B2] hover:scale-110'}`}
                            title="Share on Facebook"
                            disabled={sharedPlatforms.has('facebook')}
                        >
                            {sharedPlatforms.has('facebook') ? '✅' : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}
                        </button>
                        <button
                            onClick={() => handleShare('email')}
                            className={`p-3 rounded-full transition-all text-white border border-white/10 ${sharedPlatforms.has('email') ? 'bg-green-600/50' : 'bg-black/30 hover:bg-green-600 hover:scale-110'}`}
                            title="Share via Email"
                            disabled={sharedPlatforms.has('email')}
                        >
                            {sharedPlatforms.has('email') ? '✅' : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Browse Section */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/20 p-6">
                <h3 className="text-2xl font-bold text-white mb-6">{t('browseMore')}</h3>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300">🔍</span>
                        <input
                            type="text"
                            placeholder="Search Hadiths..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-primary-400 focus:outline-none focus:border-accent/50 focus:bg-white/10 transition"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-accent text-white font-bold shadow-lg' : 'bg-white/5 text-primary-200 hover:bg-white/10'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHadiths.slice(0, visibleCount).map((h) => (
                        <div key={h.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition group">
                            <span className="text-xs font-bold text-accent px-2 py-1 bg-accent/10 rounded mb-3 inline-block">
                                {h.category}
                            </span>
                            <p className="text-white text-lg italic mb-4 font-serif leading-relaxed">"{getLocalizedText(h as Hadith)}"</p>
                            <p className="text-primary-300 text-xs font-semibold uppercase tracking-wide border-t border-white/10 pt-3">
                                {h.source}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Load More */}
                {visibleCount < filteredHadiths.length && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 6)}
                            className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                        >
                            Load More
                        </button>
                    </div>
                )}

                {filteredHadiths.length === 0 && (
                    <div className="text-center py-12 text-primary-400">
                        No Hadiths found matching your criteria.
                    </div>
                )}
            </div>
        </div >
    );
}
