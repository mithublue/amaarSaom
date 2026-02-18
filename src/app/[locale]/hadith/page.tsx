import { Link } from '@/i18n/routing';
import HadithClient from './HadithClient';
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getHadithOfTheDay } from '@/lib/hadithService';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Hadith' });
    const hadith = getHadithOfTheDay();

    return {
        title: `${t('title')} | Ramadan Companion`,
        description: t('desc'),
        openGraph: {
            title: t('title'),
            description: locale === 'bn' ? hadith.textBn : locale === 'ar' ? hadith.textAr : hadith.textEn,
            images: [
                {
                    url: `/api/og/hadith?id=${hadith.id}&lang=${locale}`,
                    width: 1200,
                    height: 630,
                    alt: 'Daily Hadith',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: locale === 'bn' ? hadith.textBn : locale === 'ar' ? hadith.textAr : hadith.textEn,
            images: [`/api/og/hadith?id=${hadith.id}&lang=${locale}`],
        },
    };
}

export default async function HadithPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('Hadith');
    const session = await auth();
    const hadith = getHadithOfTheDay();

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

                    <HadithClient initialHadithData={hadith} />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
