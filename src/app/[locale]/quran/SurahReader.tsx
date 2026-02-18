'use client';

import { useState, useRef, useEffect } from 'react';
import { Chapter, Verse } from '@/lib/services/quranService';
import Link from 'next/link';

interface SurahReaderProps {
    surah: Chapter;
    verses: Verse[];
}

export default function SurahReader({ surah, verses }: SurahReaderProps) {
    const [playingVerse, setPlayingVerse] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    useEffect(() => {
        // Load bookmarks from local storage
        const stored = localStorage.getItem('quran_bookmarks');
        if (stored) {
            try {
                setBookmarks(JSON.parse(stored));
            } catch (e: any) {
                // Fallback for corrupted/legacy data (comma-separated strings)
                setBookmarks(stored.split(',').filter(Boolean));
            }
        }

        // Save "Continue Reading"
        if (surah) {
            localStorage.setItem('lastRead', JSON.stringify({
                surahId: surah.id,
                surahName: surah.name_simple,
                surahArabic: surah.name_arabic,
                verseCount: surah.verses_count,
                timestamp: Date.now()
            }));
        }
    }, [surah]);

    const playAudio = (verse: Verse) => {
        if (playingVerse === verse.id && audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
                setPlayingVerse(null);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            // Construct audio URL locally (Mishary Rashid Alafasy)
            // Format: 001001.mp3 (3 digits surah, 3 digits verse)
            const paddedSurah = String(surah.id).padStart(3, '0');
            const paddedVerse = String(verse.verse_key.split(':')[1]).padStart(3, '0');
            const audioUrl = `https://verses.quran.com/Alafasy/mp3/${paddedSurah}${paddedVerse}.mp3`;

            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            setPlayingVerse(verse.id);
            audio.play().catch(e => console.error("Audio play error:", e));
            audio.onended = () => setPlayingVerse(null);
        }
    };

    const toggleBookmark = (verseKey: string) => {
        const newBookmarks = bookmarks.includes(verseKey)
            ? bookmarks.filter(b => b !== verseKey)
            : [...bookmarks, verseKey];

        setBookmarks(newBookmarks);
        localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
    };

    const shareVerse = (verseKey: string) => {
        const url = `${window.location.origin}/quran/${surah.id}#ayah-${verseKey}`;
        navigator.clipboard.writeText(url);
        alert('Verse link copied to clipboard!');
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Surah Header */}
            <div className="text-center mb-12 pt-6">
                <div className="inline-block bg-primary-900/60 backdrop-blur-sm border border-white/10 shadow-sm rounded-full px-5 py-1.5 mb-6 text-accent-300 text-sm font-medium tracking-wide">
                    {surah.revelation_place} • {surah.verses_count} Verses
                </div>
                <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-3 drop-shadow-md">{surah.name_simple}</h1>
                <p className="text-xl text-primary-200 mb-6 font-light">{surah.translated_name.name}</p>
                <div className="font-arabic text-5xl text-accent-400 drop-shadow-sm">{surah.name_arabic}</div>
            </div>

            {/* Bismillah */}
            {surah.bismillah_pre && (
                <div className="text-center mb-16 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                        <div className="w-64 h-64 bg-accent-500 rounded-full blur-3xl"></div>
                    </div>
                    <div className="font-arabic text-3xl md:text-4xl text-white leading-[2.0] md:leading-[2.2] relative z-10 drop-shadow-md">
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </div>
                </div>
            )}

            {/* Verses List */}
            <div className="space-y-6">
                {verses.map((verse) => (
                    <div
                        key={verse.id}
                        id={`ayah-${verse.verse_key}`}
                        className={`bg-primary-900/40 backdrop-blur-md rounded-app-lg border ${playingVerse === verse.id ? 'border-accent-500 ring-1 ring-accent-500/50 shadow-gold-glow' : 'border-white/5 hover:border-white/10 shadow-glass'} p-6 md:p-8 transition-all duration-300`}
                    >
                        {/* Actions Toolbar */}
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                            <span className="bg-primary-950/50 text-accent-400 px-3 py-1.5 rounded-lg text-sm font-mono border border-white/5 tracking-wider">
                                {verse.verse_key}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => playAudio(verse)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${playingVerse === verse.id ? 'bg-accent-600 text-white shadow-gold-glow scale-110' : 'bg-primary-950/50 text-primary-200 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {playingVerse === verse.id ? '⏸' : '▶'}
                                </button>
                                <button
                                    onClick={() => toggleBookmark(verse.verse_key)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${bookmarks.includes(verse.verse_key) ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-primary-950/50 text-primary-200 hover:bg-white/10 hover:text-white'}`}
                                >
                                    🔖
                                </button>
                                <button
                                    onClick={() => shareVerse(verse.verse_key)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-950/50 text-primary-200 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    🔗
                                </button>
                            </div>
                        </div>

                        {/* Arabic Text */}
                        <div className="text-right mb-8">
                            <p className="font-arabic text-3xl md:text-4xl text-white leading-[2.2] md:leading-[2.5] drop-shadow-sm">
                                {verse.text_uthmani}
                            </p>
                        </div>

                        {/* Translations */}
                        <div className="space-y-6">
                            {verse.translations?.map((translation) => (
                                <div key={translation.id} className="text-primary-100 border-l-2 border-accent-500/30 pl-4">
                                    <p className={`text-lg leading-relaxed ${translation.resource_id === 161 ? 'font-bengali' : 'font-sans'}`}>
                                        {translation.text.replace(/<sup.*?<\/sup>/g, '')}
                                    </p>
                                    <p className="text-xs text-primary-400 mt-2 uppercase tracking-wider font-semibold">
                                        {translation.resource_id === 131 ? 'English - The Clear Quran' : 'Bengali - Taisirul Quran'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-16 pt-8 border-t border-white/10">
                {surah.id > 1 ? (
                    <Link href={`/quran/${surah.id - 1}`} className="flex items-center gap-2 text-primary-300 hover:text-white transition font-semibold px-4 py-2 hover:bg-white/5 rounded-lg">
                        ← Previous Surah
                    </Link>
                ) : <div></div>}

                {surah.id < 114 && (
                    <Link href={`/quran/${surah.id + 1}`} className="flex items-center gap-2 text-primary-300 hover:text-white transition font-semibold px-4 py-2 hover:bg-white/5 rounded-lg">
                        Next Surah →
                    </Link>
                )}
            </div>
        </div>
    );
}
