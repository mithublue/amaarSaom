'use client';

import { useTranslations } from 'next-intl';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface ZakatClientProps {
    session: any;
    locale: string;
}

export default function ZakatClient({ session, locale }: ZakatClientProps) {
    const t = useTranslations('ZakatPage');

    return (
        <main className="min-h-screen bg-primary-950 text-white selection:bg-accent-500 selection:text-white flex flex-col">
            <Navbar session={session} locale={locale} />

            <div className="flex-grow flex items-center justify-center pt-24 pb-12 px-4">
                <div className="text-center max-w-2xl mx-auto p-8 bg-primary-900/50 backdrop-blur-sm rounded-3xl border border-white/5 shadow-glass">
                    <div className="w-24 h-24 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <span className="text-5xl">💰</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-200 to-primary-400">
                        {t('title')}
                    </h1>

                    <div className="bg-primary-800/50 rounded-xl p-6 mb-8 border border-white/5">
                        <h2 className="text-2xl font-semibold text-accent-400 mb-3">
                            {t('comingSoon')}
                        </h2>
                        <p className="text-primary-300 leading-relaxed text-lg">
                            {t('description')}
                        </p>
                    </div>

                    <button
                        onClick={() => window.history.back()}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold transition-all border border-white/10 hover:border-white/20"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            <Footer />
        </main>
    );
}
