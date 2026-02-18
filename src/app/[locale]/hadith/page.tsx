import { Link } from '@/i18n/routing';
import HadithClient from './HadithClient';
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default async function HadithPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('Hadith');
    const tCommon = await getTranslations('Leaderboard'); // Reuse 'Back'
    const session = await auth();

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar session={session} locale={locale} />

            <main className="flex-grow container mx-auto px-4 py-8 mt-24">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 animate-fade-in">
                        <div className="inline-block p-4 rounded-full bg-primary-800/20 border border-primary-500/30 mb-6 shadow-gold-glow">
                            <span className="text-4xl">📖</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-primary-200 max-w-2xl mx-auto">
                            Daily inspiration from the Prophetic traditions to enlighten your heart.
                        </p>
                    </div>

                    <HadithClient />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
