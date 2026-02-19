import { Link } from '@/i18n/routing';
import { auth } from '@/lib/auth/config';
import IftarSehriClient from './IftarSehriClient';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getTranslations } from 'next-intl/server';

export default async function IftarSehriPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();
    const t = await getTranslations('IftarSehri');

    return (
        <div className="min-h-screen flex flex-col font-sans bg-primary-950 text-white">
            <Navbar session={session} locale={locale} />

            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 py-8 mt-24">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 animate-fade-in">
                        <div className="inline-block p-4 rounded-full bg-primary-800/20 border border-primary-500/30 mb-6 shadow-gold-glow">
                            <span className="text-4xl">🌅</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
                            Iftar & Sehri Times
                        </h1>
                        <p className="text-xl text-primary-200 max-w-2xl mx-auto">
                            Plan your day with accurate timings
                        </p>
                    </div>

                    <IftarSehriClient />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
