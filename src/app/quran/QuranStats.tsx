'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function QuranStats() {
    const [lastRead, setLastRead] = useState<{ surahId: number; surahName: string; surahArabic: string; verseCount: number } | null>(null);
    const [bookmarkCount, setBookmarkCount] = useState(0);

    useEffect(() => {
        // Load last read
        const savedRead = localStorage.getItem('lastRead');
        if (savedRead) {
            setLastRead(JSON.parse(savedRead));
        }

        // Load bookmark count
        const savedBookmarks = localStorage.getItem('quran_bookmarks');
        if (savedBookmarks) {
            try {
                setBookmarkCount(JSON.parse(savedBookmarks).length);
            } catch (error) {
                // Fallback for comma-separated string
                setBookmarkCount(savedBookmarks.split(',').filter(Boolean).length);
            }
        }
    }, []);

    return (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Continue Reading Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl group-hover:bg-white/20 transition duration-700"></div>
                <div className="relative z-10 text-white">
                    <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-4">
                        Juz {lastRead ? '...' : 1}
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Continue Reading</h2>
                    <p className="text-emerald-100 mb-6">
                        {lastRead
                            ? `Surah ${lastRead.surahName}`
                            : 'Start your journey with Al-Fatihah'}
                    </p>
                    <Link
                        href={lastRead ? `/quran/${lastRead.surahId}` : '/quran/1'}
                        className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition shadow-lg hover:shadow-xl"
                    >
                        {lastRead ? 'Resume Reading' : 'Start Reading'} →
                    </Link>
                </div>
                <div className="absolute right-8 bottom-8 font-arabic text-8xl text-white/20 select-none group-hover:scale-110 transition duration-700">
                    {lastRead ? lastRead.surahArabic : 'القرآن'}
                </div>
            </div>

            {/* Stats / Bookmarks Card */}
            <Link href="/quran/bookmarks" className="bg-primary-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col justify-between group hover:border-accent/50 transition cursor-pointer">
                <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:rotate-12 transition">
                        🔖
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Bookmarks</h3>
                    <p className="text-primary-200 text-sm">view saved verses</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-primary-900"></div>
                        <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-primary-900"></div>
                        <div className="w-8 h-8 rounded-full bg-primary-600 border-2 border-primary-900 flex items-center justify-center text-xs text-white font-bold">
                            {bookmarkCount > 0 ? `+${bookmarkCount}` : '0'}
                        </div>
                    </div>
                    <div className="text-xs text-gray-400">Saved Ayahs</div>
                </div>
            </Link>
        </div>
    );
}
