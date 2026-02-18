import { Link } from '@/i18n/routing';
import HadithClient from './HadithClient';
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default async function HadithPage() {
    const t = await getTranslations('Hadith');
    const tCommon = await getTranslations('Leaderboard'); // Reuse 'Back'

    return (
        <div className="min-h-screen bg-gradient-to-b from-background-default via-primary-50 to-primary-100">
            {/* Header */}
            <header className="bg-white/50 backdrop-blur-md border-b border-gray-200/50">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-primary-700 hover:text-accent transition"
                    >
                        ← {tCommon('back')}
                    </Link>
                    <h1 className="text-2xl font-bold text-primary-900 flex-1">{t('title')}</h1>
                    <LanguageSwitcher />
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Hadith Component */}
                    <HadithClient />


                </div>
            </main>
        </div>
    );
}
