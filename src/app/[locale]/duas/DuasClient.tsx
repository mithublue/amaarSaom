'use client';

import { useState, useMemo } from 'react';
import { Search, Grid, List as ListIcon, Play, Pause, Volume2, ChevronRight } from 'lucide-react';

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

    // Normalize data access
    const categories = useMemo(() => {
        // Adjust key based on language map if needed, defaulting to English for the structure provided
        // The JSON has "English" key. We'll use Object.values(data)[0] or specific key if we know it.
        // For now, assuming the passed data prop is the array of categories directly or the full object.
        // Let's assume data is the full JSON object.
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
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Sidebar */}
            <div className={`lg:w-1/3 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden`}>
                <div className="p-4 border-b border-gray-100 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search duas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-primary-900 placeholder-text-muted focus:outline-none focus:border-accent transition"
                        />
                    </div>
                    <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-sm">{filteredCategories.length} Categories</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsSidebarGrid(false)}
                                className={`p-1.5 rounded-lg transition ${!isSidebarGrid ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50'}`}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsSidebarGrid(true)}
                                className={`p-1.5 rounded-lg transition ${isSidebarGrid ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50'}`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className={`${isSidebarGrid ? 'grid grid-cols-2 gap-3' : 'space-y-2'}`}>
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.ID}
                                onClick={() => setSelectedCategory(cat)}
                                className={`text-left p-3 rounded-xl transition group relative overflow-hidden ${selectedCategory?.ID === cat.ID
                                    ? 'bg-accent text-primary-900 font-medium'
                                    : 'bg-white/5 text-white hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="line-clamp-2 text-sm">{cat.TITLE}</span>
                                    {!isSidebarGrid && selectedCategory?.ID === cat.ID && (
                                        <ChevronRight className="w-4 h-4 shrink-0" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-2/3 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {selectedCategory ? (
                    <>
                        <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-primary-900">{selectedCategory.TITLE}</h2>
                            {selectedCategory.AUDIO_URL && (
                                <button
                                    onClick={() => toggleAudio(selectedCategory.AUDIO_URL)}
                                    className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-full text-sm font-medium transition"
                                >
                                    {playingAudio === selectedCategory.AUDIO_URL ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    {playingAudio === selectedCategory.AUDIO_URL ? 'Pause Audio' : 'Play Audio'}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            {selectedCategory.TEXT.map((dua) => (
                                <div key={dua.ID} className="bg-slate-50/50 rounded-2xl p-6 border border-gray-200 space-y-6 shadow-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-xs font-mono text-text-muted shrink-0 border border-gray-100">
                                            {dua.ID}
                                        </div>
                                        <div className="flex gap-2">
                                            {dua.REPEAT > 1 && (
                                                <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs text-text-secondary">
                                                    Repeat {dua.REPEAT}x
                                                </span>
                                            )}
                                            {dua.AUDIO && (
                                                <button
                                                    onClick={() => toggleAudio(dua.AUDIO)}
                                                    className={`p-2 rounded-full transition ${playingAudio === dua.AUDIO
                                                        ? 'bg-accent text-white'
                                                        : 'bg-white text-primary-500 hover:bg-slate-100 border border-gray-100'
                                                        }`}
                                                >
                                                    {playingAudio === dua.AUDIO ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6 text-center">
                                        <p className="text-2xl md:text-3xl leading-loose font-arabic text-primary-900" dir="rtl">
                                            {dua.ARABIC_TEXT}
                                        </p>

                                        {dua.LANGUAGE_ARABIC_TRANSLATED_TEXT && (
                                            <p className="text-secondary-600 italic text-sm md:text-base">
                                                {dua.LANGUAGE_ARABIC_TRANSLATED_TEXT}
                                            </p>
                                        )}

                                        <p className="text-primary-800 leading-relaxed">
                                            {dua.TRANSLATED_TEXT}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-text-muted">
                        Select a category to view duas
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
