import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
import DuasClient from './DuasClient';
import englishData from '@/app/api/json/hisnul_muslim-en.json';
import bengaliData from '@/app/api/json/hisnul_muslim-bn.json';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

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

    // Select data based on locale, fallback to English
    const data = dataMap[locale] || dataMap.default;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background-default via-primary-50 to-primary-100">
            {/* Header */}
            <header className="bg-white/50 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-primary-700 hover:text-accent transition"
                        >
                            ← {tCommon('back')}
                        </Link>
                        <h1 className="text-2xl font-bold text-primary-900">{t('title')}</h1>
                    </div>
                    <LanguageSwitcher />
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <DuasClient language={locale} data={data} />
            </main>
        </div>
    );
}
