import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
import DuasClient from './DuasClient';
import englishData from '@/app/api/json/hisnul_muslim-en.json';
import bengaliData from '@/app/api/json/hisnul_muslim-bn.json';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';

// Type assertion since JSON import might not be fully typed
const dataMap: Record<string, any> = {
    en: englishData,
    bn: bengaliData,
    // fallback to english
    default: englishData
};

export default async function DuasPage() {
    const locale = await getLocale();
    const t = await getTranslations('Duas');
    const tCommon = await getTranslations('Leaderboard'); // Reuse 'Back'
    const session = await auth();

    // Select data based on locale, fallback to English
    const data = dataMap[locale] || dataMap.default;

    return (
        <div className="min-h-screen flex flex-col font-sans bg-primary-950 text-white">
            <Navbar session={session} locale={locale} />

            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 py-8 mt-24">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 animate-fade-in">
                        <div className="inline-block p-4 rounded-full bg-primary-800/20 border border-primary-500/30 mb-6 shadow-gold-glow">
                            <span className="text-4xl">🤲</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
                            {t('title')}
                        </h1>
                    </div>

                    <DuasClient language={locale} data={data} />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
