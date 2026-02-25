'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Chapter, Verse } from '@/lib/services/quranService';
import { Link } from '@/i18n/routing';
import { Facebook, Twitter, Send, ChevronDown } from 'lucide-react';

interface SurahReaderProps {
    surah: Chapter;
    verses: Verse[];
}

export default function SurahReader({ surah, verses }: SurahReaderProps) {
    const locale = useLocale();
    const [playingVerse, setPlayingVerse] = useState<number | null>(null);
    const [continuousPlay, setContinuousPlay] = useState(false);
    const [continuousFrom, setContinuousFrom] = useState<number | null>(null); // verse index
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('quran_bookmarks');
        if (stored) {
            try { setBookmarks(JSON.parse(stored)); }
            catch { setBookmarks(stored.split(',').filter(Boolean)); }
        }
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

    // Build audio URL for a verse
    const getAudioUrl = (verse: Verse) => {
        const paddedSurah = String(surah.id).padStart(3, '0');
        const paddedVerse = String(verse.verse_key.split(':')[1]).padStart(3, '0');
        return `https://verses.quran.com/Alafasy/mp3/${paddedSurah}${paddedVerse}.mp3`;
    };

    // Play a specific verse; optionally chain to next in continuous mode
    const playVerse = useCallback((verse: Verse, idx: number, chain = false) => {
        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(getAudioUrl(verse));
        audioRef.current = audio;
        setPlayingVerse(verse.id);

        audio.play().catch(e => console.error('Audio play error:', e));

        audio.onended = () => {
            setPlayingVerse(null);
            // In continuous mode, auto-play next verse
            if (chain && idx + 1 < verses.length) {
                playVerse(verses[idx + 1], idx + 1, true);
            } else {
                setContinuousFrom(null);
            }
        };
    }, [verses, surah.id]); // eslint-disable-line

    const playAudio = (verse: Verse) => {
        if (playingVerse === verse.id && audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
                setPlayingVerse(null);
                setContinuousFrom(null);
            }
        } else {
            const idx = verses.findIndex(v => v.id === verse.id);
            playVerse(verse, idx, false); // single verse
            setContinuousFrom(null);
        }
    };

    const startContinuousPlay = (fromIdx = 0) => {
        setContinuousPlay(true);
        setContinuousFrom(fromIdx);
        playVerse(verses[fromIdx], fromIdx, true);
    };

    const stopPlay = () => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        setPlayingVerse(null);
        setContinuousFrom(null);
    };

    useEffect(() => {
        // Auto-scroll to Ayah if hash exists in URL
        const hash = window.location.hash;
        if (hash) {
            const verseKey = hash.replace('#ayah-', '');
            // Small delay to ensure rendering is complete
            setTimeout(() => scrollToAyah(verseKey), 500);
        }
    }, []);

    const toggleBookmark = (verseKey: string) => {
        const next = bookmarks.includes(verseKey)
            ? bookmarks.filter(b => b !== verseKey)
            : [...bookmarks, verseKey];
        setBookmarks(next);
        localStorage.setItem('quran_bookmarks', JSON.stringify(next));
    };

    const shareVerse = (verseKey: string) => {
        const url = `${window.location.origin}/${locale}/quran/${surah.id}#ayah-${verseKey}`;
        navigator.clipboard.writeText(url);
        alert('Verse link copied to clipboard!');
    };

    const shareOnSocial = (platform: 'facebook' | 'whatsapp' | 'twitter', verseKey: string) => {
        const url = `${window.location.origin}/${locale}/quran/${surah.id}#ayah-${verseKey}`;
        const text = `Read Surah ${surah.name_simple}, Ayah ${verseKey} on Nuzul`;

        let shareUrl = '';
        if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        else if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        else if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    const scrollToAyah = (verseKey: string) => {
        const element = document.getElementById(`ayah-${verseKey}`);
        if (element) {
            const offset = 120; // accounting for sticky headers
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in relative">
            {/* Ayah Navigator - Sticky */}
            <div className="sticky top-24 z-20 flex justify-center mb-8 pointer-events-none">
                <div className="bg-primary-900/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-glass pointer-events-auto flex items-center gap-3">
                    <span className="text-xs text-primary-400 font-bold uppercase tracking-widest hidden sm:inline">Jump to:</span>
                    <div className="relative group">
                        <select
                            onChange={(e) => scrollToAyah(e.target.value)}
                            className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer appearance-none pr-6 pl-2"
                        >
                            <option value="">Select Ayah</option>
                            {verses.map((v) => (
                                <option key={v.id} value={v.verse_key} className="bg-primary-900 text-white">
                                    Ayah {v.verse_key.split(':')[1]}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400 pointer-events-none" />
                    </div>
                </div>
            </div>

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
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </div>
                </div>
            )}

            {/* ── Continuous Play Toolbar ─────────────────────────────────── */}
            <div className="flex items-center gap-3 justify-end mb-6 flex-wrap">
                {playingVerse !== null ? (
                    <button
                        onClick={stopPlay}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/90 hover:bg-red-500 text-white text-sm font-medium transition-all shadow-md"
                    >
                        ⏹ Stop Playing
                    </button>
                ) : (
                    <button
                        onClick={() => startContinuousPlay(0)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-600/90 hover:bg-accent-500 text-white text-sm font-medium transition-all shadow-md"
                    >
                        ▶▶ Play All
                    </button>
                )}
                {continuousFrom !== null && playingVerse !== null && (
                    <span className="text-xs text-accent-300 px-3 py-1 bg-accent-900/30 rounded-full border border-accent-500/20 animate-pulse">
                        🔊 Playing continuously...
                    </span>
                )}
            </div>

            {/* Verses List */}
            <div className="space-y-6">
                {verses.map((verse, idx) => (
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
                                {/* Single verse play */}
                                <button
                                    onClick={() => playAudio(verse)}
                                    title="Play this verse"
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${playingVerse === verse.id ? 'bg-accent-600 text-white shadow-gold-glow scale-110' : 'bg-primary-950/50 text-primary-200 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {playingVerse === verse.id ? '⏸' : '▶'}
                                </button>
                                {/* Play from here continuously */}
                                <button
                                    onClick={() => startContinuousPlay(idx)}
                                    title="Play continuously from this verse"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-950/50 text-accent-400 hover:bg-accent-900/40 hover:text-accent-300 transition-all text-xs font-bold"
                                >
                                    ▶▶
                                </button>
                                <button
                                    onClick={() => toggleBookmark(verse.verse_key)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${bookmarks.includes(verse.verse_key) ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-primary-950/50 text-primary-200 hover:bg-white/10 hover:text-white'}`}
                                >
                                    🔖
                                </button>
                                <div className="h-6 w-px bg-white/10 mx-1 self-center"></div>
                                {/* Social Shares */}
                                <button
                                    onClick={() => shareOnSocial('whatsapp', verse.verse_key)}
                                    title="Share on WhatsApp"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-950/50 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => shareOnSocial('facebook', verse.verse_key)}
                                    title="Share on Facebook"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-950/50 text-[#1877F2] hover:bg-[#1877F2]/20 transition-all"
                                >
                                    <Facebook className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => shareOnSocial('twitter', verse.verse_key)}
                                    title="Share on X"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-950/50 text-white hover:bg-white/10 transition-all"
                                >
                                    <Twitter className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => shareVerse(verse.verse_key)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-950/50 text-primary-200 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    🔗
                                </button>
                            </div>
                        </div>

                        {/* Arabic Text & Transliteration */}
                        <div className={`${locale === 'ar' ? 'text-right' : 'text-right'} mb-8`}>
                            <p className="font-arabic text-3xl md:text-4xl text-white leading-[2.2] md:leading-[2.5] drop-shadow-sm mb-4">
                                {verse.text_uthmani}
                            </p>
                            {/* Transliteration - English phonetics */}
                            {verse.translations?.find(t => t.resource_id === 57) && (
                                <p className={`text-left text-accent-400/90 text-sm md:text-base font-medium italic leading-relaxed ${locale === 'ar' ? 'border-r-2 pr-4 border-l-0' : 'border-l-2 pl-4'} border-accent-500/20 mt-4 animate-fade-in`}>
                                    {verse.translations.find(t => t.resource_id === 57)?.text.replace(/<sup.*?<\/sup>/g, '')}
                                </p>
                            )}
                        </div>

                        {/* Translations */}
                        <div className="space-y-6">
                            {verse.translations?.filter(t => t.resource_id !== 57).map((translation) => (
                                <div key={translation.id} className={`text-primary-100 ${locale === 'ar' ? 'border-r-2 pr-4 text-right' : 'border-l-2 pl-4 text-left'} border-accent-500/30`}>
                                    <p className={`text-lg leading-relaxed ${translation.resource_id === 161 ? 'font-bengali' : 'font-sans'}`}>
                                        {translation.text.replace(/<sup.*?<\/sup>/g, '')}
                                    </p>
                                    <p className="text-xs text-primary-400 mt-2 uppercase tracking-wider font-semibold">
                                        {translation.resource_id === 131 ? (locale === 'ar' ? 'الإنجليزية - ترجمة' : 'English - The Clear Quran') : (locale === 'ar' ? 'البنغالية - تيسير القرآن' : 'Bengali - Taisirul Quran')}
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
                    <Link href={`/quran/${surah.id - 1}`} onClick={stopPlay} className="flex items-center gap-2 text-primary-300 hover:text-white transition font-semibold px-4 py-2 hover:bg-white/5 rounded-lg">
                        ← Previous Surah
                    </Link>
                ) : <div></div>}
                {surah.id < 114 && (
                    <Link href={`/quran/${surah.id + 1}`} onClick={stopPlay} className="flex items-center gap-2 text-primary-300 hover:text-white transition font-semibold px-4 py-2 hover:bg-white/5 rounded-lg">
                        Next Surah →
                    </Link>
                )}
            </div>
        </div>
    );
}
