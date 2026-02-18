'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Bookmark {
    surahId: number;
    verseKey: string;
    // We might not have full text unless we fetch it, 
    // but for now let's just show the keys and link to them.
}

export default function BookmarksPage() {
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
        <div className="min-h-screen bg-gradient-to-b from-background-default via-primary-50 to-primary-100 pb-20">
            <div className="sticky top-0 z-50 bg-white/50 backdrop-blur-md border-b border-gray-200/50">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/quran" className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-primary-700 hover:bg-slate-200 transition">
                        ←
                    </Link>
                    <h1 className="text-xl font-bold text-primary-900">My Bookmarks</h1>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {bookmarks.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">🔖</div>
                        <h2 className="text-2xl font-bold text-primary-900 mb-2">No Bookmarks Yet</h2>
                        <p className="text-text-secondary mb-8">Mark verses while reading to save them here.</p>
                        <Link href="/quran" className="inline-block bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-accent/80 transition shadow-lg">
                            Start Reading
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bookmarks.map((bookmark) => {
                            const [surahId, verseNum] = bookmark.split(':');
                            return (
                                <Link
                                    key={bookmark}
                                    href={`/quran/${surahId}#ayah-${bookmark}`}
                                    className="block bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-md hover:border-accent/30 transition group shadow-sm"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold text-primary-900 mb-1">Surah {surahId}, Ayah {verseNum}</h3>
                                            <p className="text-text-secondary text-sm">Tap to view full verse</p>
                                        </div>
                                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-primary-400 group-hover:bg-accent group-hover:text-white transition">
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
