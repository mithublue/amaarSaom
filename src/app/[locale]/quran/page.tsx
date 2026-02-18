import Link from 'next/link';
import { getAllChapters } from '@/lib/services/quranService';
import SurahListClient from './SurahListClient';
import QuranStats from './QuranStats';

export const metadata = {
    title: 'Holy Quran | Ramadan Companion',
    description: 'Read and listen to the Holy Quran',
};

export default async function QuranPage() {
    const chapters = await getAllChapters();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-primary-900/80 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 bg-white/5 rounded-xl text-white hover:bg-white/10 transition"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Holy Quran <span className="text-accent">📖</span>
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Hero / Quick Access */}
                    <QuranStats />

                    {/* Surah List */}
                    <SurahListClient chapters={chapters} />
                </div>
            </main>
        </div>
    );
}
