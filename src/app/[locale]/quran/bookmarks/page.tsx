'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function BookmarksPage() {
    const t = useTranslations('Quran.bookmarks');
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('quran_bookmarks');
        if (stored) {
            try {
                setBookmarks(JSON.parse(stored));
            } catch (e) {
                setBookmarks(stored.split(',').filter(Boolean));
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-primary-950 text-white font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-primary-950/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/quran" className="w-10 h-10 flex items-center justify-center bg-primary-900 rounded-full text-primary-200 hover:bg-primary-800 hover:text-white transition border border-white/5">
                        ←
                    </Link>
                    <h1 className="text-xl font-bold text-white">{t('title')}</h1>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {bookmarks.length === 0 ? (
                    <div className="text-center py-20 bg-primary-900/30 rounded-2xl border border-white/5">
                        <div className="text-6xl mb-6 opacity-80">🔖</div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('empty')}</h2>
                        <p className="text-primary-400 mb-8">{t('emptyDesc')}</p>
                        <Link href="/quran" className="inline-block bg-accent-600 text-white px-8 py-3 rounded-full font-bold hover:bg-accent-500 transition shadow-gold-glow">
                            {t('startReading')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bookmarks.map((bookmark) => {
                            const [surahId, verseNum] = bookmark.split(':');
                            return (
                                <Link
                                    key={bookmark}
                                    href={`/quran/${surahId}?ayah=${verseNum}#ayah-${bookmark}`}
                                    className="block bg-primary-900/50 border border-white/5 p-6 rounded-2xl hover:bg-primary-900 hover:border-accent-500/30 transition group shadow-glass relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-accent-400 transition">
                                                {t('surah')} {surahId}, {t('ayah')} {verseNum}
                                            </h3>
                                            <p className="text-primary-400 text-sm group-hover:text-primary-300 transition">{t('viewVerse')}</p>
                                        </div>
                                        <div className="w-10 h-10 flex items-center justify-center bg-primary-800 rounded-full text-primary-400 group-hover:bg-accent-600 group-hover:text-white transition border border-white/5">
                                            →
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
