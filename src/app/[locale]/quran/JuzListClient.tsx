'use client';

import { Link } from '@/i18n/routing';
import { Juz } from '@/lib/services/quranService';
import { useTranslations } from 'next-intl';

export default function JuzListClient({ juzs, locale }: { juzs: Juz[], locale: string }) {
    const t = useTranslations('Quran');

    return (
        <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass p-6 md:p-8 animate-fade-in">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {t('bookmarks.para')} / {t('bookmarks.juz')} <span className="text-accent-400 text-lg">✨</span>
                </h3>
                <p className="text-primary-400 text-sm mt-1">Explore the Quran by its 30 parts</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {juzs.map((juz) => {
                    // Extract first surah from verse_mapping (e.g. "1": "1-7")
                    const firstSurahId = Object.keys(juz.verse_mapping)[0];
                    const verseRange = juz.verse_mapping[firstSurahId];
                    const firstVerse = verseRange.split('-')[0];

                    return (
                        <Link
                            key={juz.id}
                            href={`/quran/${firstSurahId}#ayah-${firstSurahId}:${firstVerse}`}
                            className="flex flex-col items-center p-6 bg-primary-950/30 rounded-2xl border border-white/5 hover:bg-primary-950/60 hover:border-accent-500/30 transition-all duration-300 group text-center shadow-sm hover:shadow-glass"
                        >
                            <div className="w-14 h-14 bg-primary-900/80 rounded-full flex items-center justify-center text-accent-400 font-bold text-xl mb-4 border border-white/5 group-hover:bg-accent-600 group-hover:text-white transition-all group-hover:scale-110 shadow-sm relative overflow-hidden">
                                <span className="relative z-10">{juz.juz_number}</span>
                                <div className="absolute inset-0 bg-accent-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="text-white font-bold group-hover:text-accent-300 transition text-lg leading-tight uppercase tracking-widest">
                                {t('bookmarks.para')} {juz.juz_number}
                            </div>
                            <div className="text-primary-400 text-[10px] mt-2 font-medium uppercase tracking-tighter">
                                {juz.verses_count} Ayahs
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
