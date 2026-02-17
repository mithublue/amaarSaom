import { getChapterDetails, getChapterVerses } from '@/lib/services/quranService';
import SurahReader from '../SurahReader';
import Link from 'next/link';

type Props = {
    params: Promise<{ surahId: string }>;
};

export async function generateMetadata({ params }: Props) {
    const resolvedParams = await params;
    const chapter = await getChapterDetails(parseInt(resolvedParams.surahId));
    return {
        title: chapter ? `${chapter.name_simple} | Holy Quran` : 'Surah Not Found',
        description: chapter ? `Read Surah ${chapter.name_simple} with translation and audio.` : 'Quran Reader',
    };
}

export default async function SurahPage({ params }: Props) {
    const resolvedParams = await params;
    const surahId = parseInt(resolvedParams.surahId);

    // Parallel fetch for speed
    const [surah, verses] = await Promise.all([
        getChapterDetails(surahId),
        getChapterVerses(surahId, 0, 286) // Fetch all verses for now
    ]);

    if (!surah) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Surah not found.
                <Link href="/quran" className="ml-4 underline text-accent">Go Back</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-primary-900/90 backdrop-blur-md border-b border-white/10 shadow-lg">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/quran"
                        className="p-2 bg-white/5 rounded-xl text-white hover:bg-white/10 transition"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-xl font-bold text-white flex-1 text-center pr-12">
                        {surah.name_simple} <span className="font-normal text-primary-200 ml-2">({surah.translated_name.name})</span>
                    </h1>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-8">
                <SurahReader surah={surah} verses={verses} />
            </main>
        </div>
    );
}
