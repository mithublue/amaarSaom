'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Hadith } from '@/lib/hadithService';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import html2canvas from 'html2canvas';
import { Download, Share2, Facebook, Twitter, Copy, Check } from 'lucide-react';

interface HadithClientProps {
    initialHadiths: Hadith[];
    session: any;
    locale: string;
    highlightedHadith?: Hadith;
}

export default function HadithClient({ initialHadiths, session, locale, highlightedHadith }: HadithClientProps) {
    const t = useTranslations('HadithPage');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [dailyHadith, setDailyHadith] = useState<Hadith | null>(highlightedHadith || null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Set Daily Hadith (Random for now, could be based on date)
    useEffect(() => {
        if (!highlightedHadith && initialHadiths.length > 0) {
            // Pick a deterministic hadith based on the day of the year
            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 0);
            const diff = today.getTime() - start.getTime();
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);
            const index = dayOfYear % initialHadiths.length;
            setDailyHadith(initialHadiths[index]);
        }
    }, [initialHadiths, highlightedHadith]);

    // Handle Download Image
    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#022c22', // primary-950 to match theme
                scale: 2, // Retine quality
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `daily-hadith-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download image', err);
        } finally {
            setDownloading(false);
        }
    };

    // Handle Share
    const handleShare = async () => {
        if (navigator.share && dailyHadith) {
            try {
                await navigator.share({
                    title: 'Daily Hadith',
                    text: `${dailyHadith.textAr}\n\n${dailyHadith.textBn}\n\n${dailyHadith.source}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: Copy link
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(initialHadiths.map(h => h.category));
        return ['All', ...Array.from(cats)];
    }, [initialHadiths]);

    // Filter logic
    const filteredHadiths = useMemo(() => {
        return initialHadiths.filter(h => {
            const matchesSearch =
                h.textEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.textBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.source.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [initialHadiths, searchQuery, selectedCategory]);

    return (
        <main className="min-h-screen bg-primary-950 text-white selection:bg-accent-500 selection:text-white">
            <Navbar session={session} locale={locale} />

            <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-full bg-primary-800/20 border border-primary-500/30 mb-4 shadow-gold-glow animate-fade-in">
                        <span className="text-3xl">📖</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-200 to-primary-400 font-heading">
                        {t('title')}
                    </h1>
                    <p className="text-primary-300 max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Hero Section - Daily Hadith */}
                {dailyHadith && (
                    <div className="mb-16 animate-fade-in-up">
                        <div className="relative max-w-4xl mx-auto">
                            {/* Card Content */}
                            <div
                                ref={cardRef}
                                className="bg-primary-900 rounded-3xl p-8 md:p-12 border border-white/10 shadow-glass relative overflow-hidden"
                            >
                                {/* Background Pattern */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[url('/pattern.png')] opacity-5 pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4"></div>
                                <div className="absolute top-4 left-6 text-primary-800 text-9xl font-serif opacity-10 pointer-events-none">❝</div>

                                <div className="flex flex-col items-center text-center relative z-10">
                                    <span className="text-accent-400 text-xs font-bold tracking-widest uppercase mb-6 px-3 py-1 bg-accent-500/10 rounded-full border border-accent-500/20">
                                        Ramadan Companion
                                    </span>

                                    {/* Scrollable Text Area if too long, but try to keep it clean */}
                                    <h2 className="text-2xl md:text-3xl lg:text-4xl leading-relaxed font-medium text-white mb-8 max-w-3xl">
                                        "{dailyHadith.textBn}"
                                    </h2>

                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="h-0.5 w-12 bg-accent-500/50"></div>
                                        <span className="text-accent-300 font-bold uppercase tracking-wider text-sm md:text-base">
                                            — {dailyHadith.source}
                                        </span>
                                        <div className="h-0.5 w-12 bg-accent-500/50"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar (Outside the capture area to avoid capturing buttons) */}
                            <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
                                <div className="bg-primary-800/90 backdrop-blur-md border border-white/10 p-2 rounded-2xl shadow-xl flex items-center gap-3">
                                    <div className="px-4 py-2 bg-black/20 rounded-xl flex items-center gap-2 border border-white/5">
                                        <span className="text-amber-400 text-xs">▶</span>
                                        <span className="text-xs font-bold text-primary-200">REWARD: 10 POINTS</span>
                                    </div>

                                    <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-all border border-white/5 hover:border-white/20"
                                    >
                                        {downloading ? (
                                            <span className="animate-spin">⏳</span>
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        {t('saveImage') || 'Save Image'}
                                    </button>

                                    <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                                    {/* Social Share Buttons */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                if (!dailyHadith) return;
                                                const url = `${window.location.origin}/${locale}/hadith/${dailyHadith.id}`;
                                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                                            }}
                                            className="p-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg transition-all shadow-sm hover:scale-105"
                                            title="Share on Facebook"
                                        >
                                            <Facebook className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!dailyHadith) return;
                                                const url = `${window.location.origin}/${locale}/hadith/${dailyHadith.id}`;
                                                const text = `Daily Hadith: ${dailyHadith.textBn.substring(0, 100)}...`;
                                                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                                            }}
                                            className="p-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-lg transition-all shadow-sm hover:scale-105"
                                            title="Share on Twitter"
                                        >
                                            <Twitter className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!dailyHadith) return;
                                                const url = `${window.location.origin}/${locale}/hadith/${dailyHadith.id}`;
                                                navigator.clipboard.writeText(url);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all shadow-sm hover:scale-105"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Browse Section Title */}
                <div className="text-center mb-8 mt-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {locale === 'bn' ? 'আরও হাদিস দেখুন' : 'Browse More Hadiths'}
                    </h2>
                    <p className="text-primary-400 text-sm">
                        {locale === 'bn' ? 'রাসূল (সা:) এর বাণী থেকে শিক্ষা নিন' : 'Explore the vast wisdom of Prophetic narrations'}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center bg-primary-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    {/* Search */}
                    <div className="relative w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            // Updated styles to match IftarSehri input
                            className="w-full pl-10 pr-4 py-3 bg-primary-800 text-white border border-white/10 rounded-lg focus:outline-none focus:border-accent-500 placeholder-primary-500 transition-colors"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500">
                            🔍
                        </span>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/20'
                                    : 'bg-primary-800 text-primary-300 hover:bg-primary-700 hover:text-white'
                                    }`}
                            >
                                {cat === 'All' ? t('allCategories') : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hadith Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHadiths.length > 0 ? (
                        filteredHadiths.map((hadith) => (
                            <div
                                key={hadith.id}
                                className="group bg-primary-900 rounded-2xl p-6 border border-white/5 hover:border-accent-500/30 transition-all hover:shadow-glow hover:-translate-y-1 relative overflow-hidden flex flex-col h-full"
                            >
                                {/* Decorative Pattern */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[url('/pattern.png')] opacity-5 pointer-events-none"></div>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 bg-primary-800 rounded-full text-xs font-semibold text-accent-400 border border-white/5 uppercase tracking-wider">
                                        {hadith.category}
                                    </span>
                                    {/* Share Button (Mini) */}
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${hadith.textAr}\n\n${hadith.textBn}\n\n${hadith.source}`);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="text-primary-500 hover:text-white transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-grow">
                                    <div className="mb-4">
                                        <p className="text-primary-100 font-medium leading-relaxed text-lg">
                                            "{hadith.textBn}"
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-primary-400">
                                    <span className="font-bold text-accent-300">
                                        — {hadith.source}
                                    </span>
                                    <span className="font-mono opacity-50">#{hadith.id}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-primary-400">
                            <p className="text-xl">No Hadiths found.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
