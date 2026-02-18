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
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="pt-6 pb-2">
                <div className="container mx-auto px-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-primary-100 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                    >
                        <span>←</span> Back
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-white drop-shadow-md flex items-center gap-3">
                        Holy Quran <span className="text-accent-400 text-2xl">📖</span>
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
