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
            } catch (e) {
                // Fallback for corrupted/legacy data (comma-separated strings)
                setBookmarks(stored.split(',').filter(Boolean));
            }
        }

        // Save "Continue Reading"
        localStorage.setItem('lastRead', JSON.stringify({
            surahId: surah.id,
            surahName: surah.name_simple,
            surahArabic: surah.name_arabic,
            verseCount: surah.verses_count,
            timestamp: Date.now()
        }));
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

    // Bismillah Handling:
    // API returns verses. If Surah is not Tawbah (9), it typically doesn't include Bismillah as verse 1 
    // unless it's Al-Fatihah. Most APIs provide a "bismillah_pre" flag in chapter info.

    return (
        <div className="max-w-4xl mx-auto">
            {/* Surah Header */}
            <div className="text-center mb-10 pt-4">
                <div className="inline-block bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1 mb-4 text-primary-200 text-sm">
                    {surah.revelation_place} • {surah.verses_count} Verses
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{surah.name_simple}</h1>
                <p className="text-xl text-primary-200 mb-4">{surah.translated_name.name}</p>
                <div className="font-arabic text-4xl text-accent/80">{surah.name_arabic}</div>
            </div>

            {/* Bismillah */}
            {surah.bismillah_pre && (
                <div className="text-center mb-12">
                    <div className="font-arabic text-3xl md:text-4xl text-white leading-[2.0] md:leading-[2.2]">
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
                        className={`bg-white/5 backdrop-blur-md rounded-3xl border ${playingVerse === verse.id ? 'border-accent/50 bg-white/10' : 'border-white/10'} p-6 transition-all`}
                    >
                        {/* Actions Toolbar */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                            <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm font-mono">
                                {verse.verse_key}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => playAudio(verse)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition ${playingVerse === verse.id ? 'bg-accent text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    {playingVerse === verse.id ? '⏸' : '▶'}
                                </button>
                                <button
                                    onClick={() => toggleBookmark(verse.verse_key)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition ${bookmarks.includes(verse.verse_key) ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    🔖
                                </button>
                                <button
                                    onClick={() => shareVerse(verse.verse_key)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                                >
                                    🔗
                                </button>
                            </div>
                        </div>

                        {/* Arabic Text */}
                        <div className="text-right mb-6">
                            <p className="font-arabic text-3xl md:text-4xl text-white leading-[2.2] md:leading-[2.5]">
                                {verse.text_uthmani}
                            </p>
                        </div>

                        {/* Translations */}
                        <div className="space-y-4">
                            {verse.translations?.map((translation) => (
                                <div key={translation.id} className="text-gray-300">
                                    <p className={`text-lg leading-relaxed ${translation.resource_id === 161 ? 'font-bengali' : ''}`}>
                                        {translation.text.replace(/<sup.*?<\/sup>/g, '')}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                        {translation.resource_id === 131 ? 'English - The Clear Quran' : 'Bengali - Taisirul Quran'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-12 pt-8 border-t border-white/10">
                {surah.id > 1 ? (
                    <Link href={`/quran/${surah.id - 1}`} className="flex items-center gap-2 text-white hover:text-accent transition">
                        ← Previous Surah
                    </Link>
                ) : <div></div>}

                {surah.id < 114 && (
                    <Link href={`/quran/${surah.id + 1}`} className="flex items-center gap-2 text-white hover:text-accent transition">
                        Next Surah →
                    </Link>
                )}
            </div>
        </div>
    );
}
