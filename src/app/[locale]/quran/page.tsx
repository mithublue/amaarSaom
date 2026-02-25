import { Link } from '@/i18n/routing';
import { getAllChapters, getAllJuzs } from '@/lib/services/quranService';
import SurahListClient from './SurahListClient';
import JuzListClient from './JuzListClient';
import QuranStats from './QuranStats';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';

export const metadata = {
    title: 'Holy Quran | Nuzul',
    description: 'Read and listen to the Holy Quran',
};

export default async function QuranPage({ params, searchParams }: {
    params: Promise<{ locale: string }>,
    searchParams: Promise<{ tab?: string }>
}) {
    const [chapters, juzs] = await Promise.all([
        getAllChapters(),
        getAllJuzs()
    ]);
    const { locale } = await params;
    const { tab = 'surah' } = await searchParams;
    const session = await auth();
    const t = await getTranslations({ locale, namespace: 'Quran' });

    return (
        <div className="min-h-screen flex flex-col font-sans bg-primary-950 text-white">
            <Navbar session={session} locale={locale} />

            <main className="flex-grow container mx-auto px-4 py-8 mt-24">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 animate-fade-in">
                        <div className="inline-block p-4 rounded-full bg-primary-800/20 border border-primary-500/30 mb-6 shadow-gold-glow">
                            <span className="text-4xl">📖</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-primary-200 max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* Stats Section */}
                    <QuranStats locale={locale} />

                    {/* Navigation Tabs */}
                    <div className="flex justify-center gap-4 mb-8">
                        <Link
                            href="?tab=surah"
                            scroll={false}
                            className={`px-8 py-3 rounded-full font-bold transition-all ${tab === 'surah' ? 'bg-accent-600 text-white shadow-gold-glow scale-105' : 'bg-primary-900/50 text-primary-300 hover:bg-white/10'}`}
                        >
                            {t('surah')}
                        </Link>
                        <Link
                            href="?tab=juz"
                            scroll={false}
                            className={`px-8 py-3 rounded-full font-bold transition-all ${tab === 'juz' ? 'bg-accent-600 text-white shadow-gold-glow scale-105' : 'bg-primary-900/50 text-primary-300 hover:bg-white/10'}`}
                        >
                            {t('bookmarks.para')}
                        </Link>
                    </div>

                    {/* Content Section */}
                    {tab === 'surah' ? (
                        <SurahListClient chapters={chapters} locale={locale} />
                    ) : (
                        <JuzListClient juzs={juzs} locale={locale} />
                    )}
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
