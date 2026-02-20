'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { Chapter } from '@/lib/services/quranService';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SurahListClient({ chapters, locale }: { chapters: Chapter[], locale: string }) {
    const t = useTranslations('Quran');
    const [searchQuery, setSearchQuery] = useState('');
    const [displayCount, setDisplayCount] = useState(15);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Reset display count when search changes
    useEffect(() => {
        setDisplayCount(15);
    }, [searchQuery]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setDisplayCount((prev) => Math.min(prev + 12, chapters.length));
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [chapters.length]);

    const filteredChapters = chapters.filter(chapter =>
        chapter.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(chapter.id).includes(searchQuery)
    );

    const visibleChapters = filteredChapters.slice(0, displayCount);

    return (
        <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass p-6 md:p-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {t('bookmarks.startReading')} <span className="text-accent-400 text-lg">✨</span>
                </h3>
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-primary-800 text-white border border-white/10 rounded-xl focus:outline-none focus:border-accent-500 placeholder-primary-500 transition shadow-inner"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 w-4 h-4" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleChapters.map((chapter) => (
                    <Link
                        key={chapter.id}
                        href={`/quran/${chapter.id}`}
                        locale={locale} // Explicitly pass locale
                        className="flex items-center p-4 bg-primary-950/30 rounded-xl border border-white/5 hover:bg-primary-950/60 hover:border-accent-500/30 transition-all duration-300 group shadow-sm hover:shadow-glass"
                    >
                        <div className="w-12 h-12 bg-primary-900/80 rounded-lg flex items-center justify-center text-accent-400 font-bold text-lg mr-4 border border-white/5 group-hover:bg-accent-600 group-hover:text-white transition-all group-hover:scale-110 shadow-sm relative overflow-hidden">
                            <span className="relative z-10">{chapter.id}</span>
                            <div className="absolute inset-0 bg-accent-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-white font-bold group-hover:text-accent-300 transition">{chapter.name_simple}</h4>
                                    <p className="text-primary-400 text-xs">{chapter.translated_name.name}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-primary-200 font-arabic text-xl block leading-none mb-1 group-hover:text-white transition">{chapter.name_arabic}</span>
                                    <span className="text-[10px] text-primary-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">{chapter.verses_count} {t('ayahs')}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Loading Indicator / Observer Target */}
            {visibleChapters.length < filteredChapters.length && (
                <div ref={observerTarget} className="py-8 flex justify-center">
                    <div className="w-8 h-8 border-4 border-primary-800 border-t-accent-500 rounded-full animate-spin"></div>
                </div>
            )}

            {filteredChapters.length === 0 && (
                <div className="text-center py-16 text-primary-400 bg-white/5 rounded-xl border border-white/5 mt-4">
                    <div className="text-4xl mb-3 opacity-50">🔍</div>
                    <p>No surahs found matching "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
}
