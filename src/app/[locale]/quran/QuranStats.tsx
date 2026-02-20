'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function QuranStats({ locale }: { locale: string }) {
    const t = useTranslations('Quran.stats');
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
        <div className="grid md:grid-cols-3 gap-6 mb-8 animate-fade-in">
            {/* Continue Reading Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-primary-800 to-primary-700 border border-accent-500/20 rounded-app-lg p-8 relative overflow-hidden group shadow-glass">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl group-hover:bg-accent-500/20 transition duration-700"></div>
                <div className="relative z-10 text-white">
                    <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-xs font-semibold mb-4 text-accent-300">
                        {lastRead ? '...' : 1}
                    </div>
                    <h2 className="text-3xl font-heading font-bold mb-2">{t('continueReading')}</h2>
                    <p className="text-primary-200 mb-6">
                        {lastRead
                            ? `${t('surah')} ${lastRead.surahName}`
                            : t('startJourney')}
                    </p>
                    <Link
                        href={lastRead ? `/quran/${lastRead.surahId}` : '/quran/1'}
                        locale={locale}
                        className="inline-flex items-center gap-2 bg-accent-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-accent-500 transition shadow-gold-glow hover:scale-105"
                    >
                        {lastRead ? t('resumeReading') : t('resumeReading')} →
                    </Link>
                </div>
                <div className="absolute right-8 bottom-8 font-arabic text-8xl text-white/5 select-none group-hover:scale-110 transition duration-700">
                    {lastRead ? lastRead.surahArabic : 'القرآن'}
                </div>
            </div>

            {/* Stats / Bookmarks Card */}
            <Link href="/quran/bookmarks" locale={locale} className="bg-primary-900/40 backdrop-blur-md border border-white/10 shadow-glass rounded-app-lg p-6 flex flex-col justify-between group hover:border-accent-500/30 transition cursor-pointer">
                <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:rotate-12 transition shadow-sm text-white">
                        🔖
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{t('bookmarks')}</h3>
                    <p className="text-primary-300 text-sm">{t('viewSavedVerses')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-primary-900"></div>
                        <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-primary-900"></div>
                        <div className="w-8 h-8 rounded-full bg-primary-700 border-2 border-primary-900 flex items-center justify-center text-xs text-white font-bold">
                            {bookmarkCount > 0 ? `+${bookmarkCount}` : '0'}
                        </div>
                    </div>
                    <div className="text-xs text-primary-400">{t('savedAyahs')}</div>
                </div>
            </Link>
        </div>
    );
}
