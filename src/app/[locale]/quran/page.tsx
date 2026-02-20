import { Link } from '@/i18n/routing';
import { getAllChapters } from '@/lib/services/quranService';
import SurahListClient from './SurahListClient';
import QuranStats from './QuranStats';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';

export const metadata = {
    title: 'Holy Quran | Nuzul',
    description: 'Read and listen to the Holy Quran',
};

export default async function QuranPage({ params }: { params: Promise<{ locale: string }> }) {
    const chapters = await getAllChapters();
    const { locale } = await params;
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

                    {/* Surah List */}
                    <SurahListClient chapters={chapters} locale={locale} />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
