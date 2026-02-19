'use client';

import { useTranslations } from 'next-intl';
import { User } from 'next-auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface ProfileClientProps {
    user: User;
    locale: string; // Add locale prop if needed for Navbar/Footer
}

export default function ProfileClient({ user, locale }: ProfileClientProps) {
    const t = useTranslations('Profile');

    return (
        <div className="min-h-screen bg-primary-950 text-white selection:bg-accent-500 selection:text-white flex flex-col">
            <Navbar session={{ user }} locale={locale} />

            <main className="flex-grow pt-24 pb-12 px-4 max-w-4xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
                    <div className="bg-primary-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="w-24 h-24 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
                        <p className="text-primary-300 mb-6">{user.email}</p>

                        <div className="text-left mt-8 border-t border-white/10 pt-6">
                            <h3 className="text-xl font-semibold mb-4">{t('locationSettings')}</h3>
                            <p className="text-primary-400 text-sm mb-4">{t('locationDesc')}</p>
                            {/* Placeholder for location settings */}
                            <div className="bg-primary-800 p-4 rounded-lg">
                                <p className="text-center text-primary-400">Location Settings Coming Soon...</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <a href="/api/auth/signout" className="inline-block px-6 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 rounded-lg transition-colors border border-red-500/30">
                                Sign Out
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <Footer language={locale} />
        </div>
    );
}
