import { Link } from '@/i18n/routing';
import PrayerTimesClient from './PrayerTimesClient';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import { auth } from '@/lib/auth/config';
import Footer from '@/components/layout/Footer';

export default async function PrayerTimesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('PrayerTimes');
    const session = await auth();

    return (
        <div className="min-h-screen flex flex-col font-sans bg-primary-950 text-white">
            <Navbar session={session} locale={locale} />

            <main className="flex-grow container mx-auto px-4 py-8 mt-24">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 animate-fade-in">
                        <div className="inline-block p-4 rounded-full bg-linear-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 mb-6 shadow-gold-glow">
                            <span className="text-4xl">🕌</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-primary-200 max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>
                    </div>

                    <PrayerTimesClient />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
