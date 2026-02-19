'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Hadith } from '@/lib/hadithService';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface HadithClientProps {
    initialHadiths: Hadith[];
    session: any;
    locale: string;
}

export default function HadithClient({ initialHadiths, session, locale }: HadithClientProps) {
    const t = useTranslations('HadithPage');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

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
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-200 to-primary-400">
                        {t('title')}
                    </h1>
                    <p className="text-primary-300 max-w-2xl mx-auto">
                        {t('subtitle')}
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
                            className="w-full pl-10 pr-4 py-2 bg-primary-800 border border-white/10 rounded-lg focus:outline-none focus:border-accent-500 text-white placeholder-primary-500 transition-colors"
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
                                className="group bg-primary-900 rounded-2xl p-6 border border-white/5 hover:border-accent-500/30 transition-all hover:shadow-glow hover:-translate-y-1 relative overflow-hidden"
                            >
                                {/* Decorative Pattern */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[url('/pattern.png')] opacity-5 pointer-events-none"></div>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 bg-primary-800 rounded-full text-xs font-semibold text-accent-400 border border-white/5">
                                        {hadith.category}
                                    </span>
                                    <span className="text-xs text-primary-400 font-mono">
                                        #{hadith.id}
                                    </span>
                                </div>

                                {/* Arabic Text */}
                                <div className="text-right mb-4">
                                    <p className="font-arabic text-xl md:text-2xl text-white leading-relaxed" dir="rtl">
                                        {hadith.textAr}
                                    </p>
                                </div>

                                {/* Bangla Text */}
                                <div className="mb-3">
                                    <p className="text-primary-100 font-medium leading-relaxed">
                                        {hadith.textBn}
                                    </p>
                                </div>

                                {/* English Text (Optional/Secondary) */}
                                <div className="mb-6 opacity-70">
                                    <p className="text-sm text-primary-300 italic">
                                        "{hadith.textEn}"
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-xs text-primary-400">
                                    <span className="font-semibold text-accent-300">
                                        {hadith.source}
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${hadith.textAr}\n\n${hadith.textBn}\n\n${hadith.source}`);
                                            alert(t('copied'));
                                        }}
                                        className="hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        📋 {t('copy')}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-primary-400">
                            <p className="text-xl">Updating...</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
