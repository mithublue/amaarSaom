'use client';

import { useState, useMemo } from 'react';
import { Search, Grid, List as ListIcon, Play, Pause, Volume2, ChevronRight, X } from 'lucide-react';

interface Dua {
    ID: number;
    ARABIC_TEXT: string;
    LANGUAGE_ARABIC_TRANSLATED_TEXT: string;
    TRANSLATED_TEXT: string;
    REPEAT: number;
    AUDIO: string;
}

interface Category {
    ID: number;
    TITLE: string;
    AUDIO_URL: string;
    TEXT: Dua[];
}

interface DuasClientProps {
    language: string;
    data: { [key: string]: Category[] }; // Assuming structure { "English": [...] } based on JSON
}

export default function DuasClient({ language, data }: DuasClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isSidebarGrid, setIsSidebarGrid] = useState(false);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Normalize data access
    const categories = useMemo(() => {
        const keys = Object.keys(data);
        if (keys.length > 0) {
            return data[keys[0]];
        }
        return [];
    }, [data]);

    // Initialize selected category
    useMemo(() => {
        if (!selectedCategory && categories.length > 0) {
            setSelectedCategory(categories[0]);
        }
    }, [categories, selectedCategory]);


    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        return categories.filter(cat =>
            cat.TITLE.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const toggleAudio = (url: string) => {
        const audio = document.getElementById('dua-audio-player') as HTMLAudioElement;
        if (playingAudio === url) {
            audio.pause();
            setPlayingAudio(null);
        } else {
            audio.src = url;
            audio.play();
            setPlayingAudio(url);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-auto lg:h-[calc(100vh-280px)] min-h-[600px] animate-fade-in relative pt-16 lg:pt-0">

            {/* Mobile Sticky Header */}
            <div className="lg:hidden fixed top-[64px] left-0 right-0 z-30 bg-primary-950/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-md">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -ml-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ListIcon className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <span>🤲</span> {selectedCategory?.TITLE || 'Duas & Amals'}
                </h1>
                <div className="w-8"></div> {/* Spacer for alignment */}
            </div>

            {/* Categories Sidebar (Desktop + Mobile Overlay) */}
            <div className={`
                fixed inset-0 z-50 bg-primary-900/95 backdrop-blur-xl transition-transform duration-300 transform
                lg:translate-x-0 lg:static lg:z-auto lg:bg-primary-900/40 lg:backdrop-blur-md lg:w-1/3 lg:flex lg:flex-col lg:rounded-app-lg lg:border lg:border-white/10 lg:shadow-glass lg:overflow-hidden
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-white/5 space-y-4 relative">
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden absolute top-4 right-4 p-2 text-primary-400 hover:text-white bg-white/5 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative group pt-6 lg:pt-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 group-focus-within:text-accent-400 transition-colors w-4 h-4 ml-0 mt-3 lg:mt-0" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-primary-800 text-white border border-white/10 rounded-xl pl-11 pr-4 py-3 placeholder-primary-500 focus:outline-none focus:border-accent-500 transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex justify-between items-center text-primary-300">
                        <span className="text-sm font-medium">{filteredCategories.length} Categories</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsSidebarGrid(false)}
                                title="List View"
                                className={`p-2 rounded-lg transition-all ${!isSidebarGrid ? 'bg-accent-600 text-white shadow-gold-glow' : 'text-primary-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <ListIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsSidebarGrid(true)}
                                title="Grid View"
                                className={`p-2 rounded-lg transition-all ${isSidebarGrid ? 'bg-accent-600 text-white shadow-gold-glow' : 'text-primary-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className={`${isSidebarGrid ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.ID}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`text-left p-4 rounded-xl transition-all duration-300 relative overflow-hidden group border ${selectedCategory?.ID === cat.ID
                                    ? 'bg-accent-600 border-accent-400 text-white shadow-gold-glow scale-[1.02]'
                                    : 'bg-white/5 border-white/5 text-primary-100 hover:bg-white/10 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-3 relative z-10">
                                    <span className={`text-sm tracking-tight ${selectedCategory?.ID === cat.ID ? 'font-bold' : 'font-medium'}`}>
                                        {cat.TITLE}
                                    </span>
                                    {!isSidebarGrid && selectedCategory?.ID === cat.ID && (
                                        <ChevronRight className="w-4 h-4 shrink-0" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Duas Main Content */}
            <div className="w-full lg:w-2/3 flex flex-col bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 shadow-glass overflow-hidden h-full">
                {selectedCategory ? (
                    <>
                        <div className="p-4 md:p-6 border-b border-white/5 bg-white/5 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl md:text-2xl font-heading font-bold text-white drop-shadow-md leading-tight">{selectedCategory.TITLE}</h2>
                            {selectedCategory.AUDIO_URL && (
                                <button
                                    onClick={() => toggleAudio(selectedCategory.AUDIO_URL)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 shrink-0 ${playingAudio === selectedCategory.AUDIO_URL
                                        ? 'bg-accent-600 text-white shadow-gold-glow animate-pulse'
                                        : 'bg-white/10 text-accent-300 hover:bg-white/20 border border-white/10'}`}
                                >
                                    {playingAudio === selectedCategory.AUDIO_URL ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-accent-300" />}
                                    {playingAudio === selectedCategory.AUDIO_URL ? 'Pause' : 'Play Audio'}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6 md:space-y-8">
                            {selectedCategory.TEXT.map((dua) => (
                                <div key={dua.ID} className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/5 hover:border-white/10 transition-all duration-300 space-y-6 md:space-y-8 relative group shadow-sm">
                                    <div className="flex justify-between items-center bg-black/10 -mx-4 -mt-4 md:-mx-4 md:-mt-4 px-4 py-2 rounded-t-2xl border-b border-white/5 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 flex items-center justify-center bg-accent-500/10 rounded-full text-xs font-bold text-accent-400 border border-accent-500/20">
                                                {dua.ID}
                                            </div>
                                            {dua.REPEAT > 1 && (
                                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                                    Repeat {dua.REPEAT}x
                                                </span>
                                            )}
                                        </div>

                                        {dua.AUDIO && (
                                            <button
                                                onClick={() => toggleAudio(dua.AUDIO)}
                                                title="Play Audio"
                                                className={`p-2.5 rounded-full transition-all duration-300 ${playingAudio === dua.AUDIO
                                                    ? 'bg-accent-600 text-white shadow-gold-glow animate-float'
                                                    : 'bg-white/5 text-accent-300 hover:bg-white/10 border border-white/5'
                                                    }`}
                                            >
                                                {playingAudio === dua.AUDIO ? <Pause className="w-4 h-4 fill-white" /> : <Volume2 className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-6 md:space-y-8 text-center px-2 md:px-4">
                                        <p className="text-2xl md:text-5xl leading-[1.8] font-arabic text-white mb-6 md:mb-8 drop-shadow-md select-all" dir="rtl">
                                            {dua.ARABIC_TEXT}
                                        </p>

                                        {dua.LANGUAGE_ARABIC_TRANSLATED_TEXT && (
                                            <div className="relative inline-block">
                                                <div className="absolute inset-0 bg-accent-500/5 blur-xl rounded-full"></div>
                                                <p className="relative z-10 text-accent-200 italic text-base md:text-xl font-medium tracking-wide">
                                                    {dua.LANGUAGE_ARABIC_TRANSLATED_TEXT}
                                                </p>
                                            </div>
                                        )}

                                        <div className="relative pt-4">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                            <p className="text-primary-100 leading-relaxed text-base md:text-xl font-medium opacity-90 first-letter:text-xl md:first-letter:text-2xl first-letter:text-accent-400">
                                                {dua.TRANSLATED_TEXT}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hover Design Accent */}
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-600/0 to-transparent group-hover:via-accent-600/30 transition-all duration-700"></div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-primary-400 space-y-4 opacity-50">
                        <div className="text-6xl mb-4">🤲</div>
                        <p className="text-xl font-medium tracking-wide">Select a category to view duas</p>
                    </div>
                )}
            </div>

            {/* Hidden Audio Player */}
            <audio
                id="dua-audio-player"
                className="hidden"
                onEnded={() => setPlayingAudio(null)}
            />
        </div>
    );
}
