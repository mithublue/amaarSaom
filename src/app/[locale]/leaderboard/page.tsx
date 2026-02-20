import { Metadata } from 'next';
import LeaderboardClient from './LeaderboardClient';
import { Link } from '@/i18n/routing';
import { auth } from '@/lib/auth/config';
import { redirect } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'Community Leaderboard | Nuzul',
    description: 'Compete for good deeds and track your spiritual progress',
};

export default async function LeaderboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();
    const t = await getTranslations('Leaderboard');

    if (!session) {
        redirect({ href: '/auth/signin', locale });
    }

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar session={session} locale={locale} />

            <main className="flex-grow container mx-auto px-4 py-8 mt-24">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 animate-fade-in">
                        <div className="inline-block p-4 rounded-full bg-primary-800/20 border border-primary-500/30 mb-6 shadow-gold-glow">
                            <span className="text-4xl">🏆</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-primary-200 max-w-2xl mx-auto">
                            Track your spiritual journey and compete for good deeds with the community.
                        </p>
                    </div>

                    <LeaderboardClient />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
