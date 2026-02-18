'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { Chapter } from '@/lib/services/quranService';

export default function SurahListClient({ chapters }: { chapters: Chapter[] }) {
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
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold text-white">Browse Surahs</h3>
                <input
                    type="text"
                    placeholder="Search Surah (e.g. Yasin, 36)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleChapters.map((chapter) => (
                    <Link
                        key={chapter.id}
                        href={`/quran/${chapter.id}`}
                        className="flex items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 border border-white/5 hover:border-accent/30 transition group"
                    >
                        <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-accent font-bold text-lg mr-4 group-hover:bg-accent group-hover:text-white transition group-hover:scale-110">
                            {chapter.id}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-white font-bold group-hover:text-accent transition">{chapter.name_simple}</h4>
                                    <p className="text-primary-200 text-xs">{chapter.translated_name.name}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-gray-400 font-arabic text-lg block leading-none mb-1">{chapter.name_arabic}</span>
                                    <span className="text-xs text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">{chapter.verses_count} ayahs</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Loading Indicator / Observer Target */}
            {visibleChapters.length < filteredChapters.length && (
                <div ref={observerTarget} className="py-8 flex justify-center">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-accent rounded-full animate-spin"></div>
                </div>
            )}

            {filteredChapters.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    No surahs found matching "{searchQuery}"
                </div>
            )}
        </div>
    );
}
