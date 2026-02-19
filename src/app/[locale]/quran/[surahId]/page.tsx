import { getChapterDetails, getChapterVerses } from '@/lib/services/quranService';
import SurahReader from '../SurahReader';
import { Link } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';

type Props = {
    params: Promise<{ surahId: string; locale: string }>;
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
    const { locale } = resolvedParams;
    const surahId = parseInt(resolvedParams.surahId);
    const session = await auth();

    // Parallel fetch for speed
    const [surah, verses] = await Promise.all([
        getChapterDetails(surahId),
        getChapterVerses(surahId, 0, 286) // Fetch all verses for now
    ]);

    if (!surah) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-primary-950">
                <div className="text-center">
                    <p className="mb-4">Surah not found.</p>
                    <Link href="/quran" className="underline text-accent-400">Go Back</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-sans bg-primary-950 text-white">
            <Navbar session={session} locale={locale} />

            {/* Content */}
            <main className="flex-grow container mx-auto px-4 py-8 mt-24">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/quran"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-primary-200 hover:bg-white/10 hover:text-white transition-all shadow-sm mb-6"
                    >
                        <span>←</span> Back to List
                    </Link>

                    <SurahReader surah={surah} verses={verses} />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
