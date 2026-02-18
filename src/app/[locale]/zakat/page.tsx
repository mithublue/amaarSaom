import { Link } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';

export default async function ZakatPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();
    const t = await getTranslations('ZakatPage');

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar session={session} locale={locale} />

            <main className="flex-grow container mx-auto px-4 py-8 mt-24 flex items-center justify-center">
                <div className="max-w-2xl w-full mx-auto text-center animate-fade-in">

                    {/* Icon container with glow */}
                    <div className="inline-block p-8 rounded-full bg-primary-800/30 border border-accent-500/30 mb-8 shadow-gold-glow animate-float relative">
                        <span className="text-7xl relative z-10">💰</span>
                        <div className="absolute inset-0 bg-accent-500/10 rounded-full blur-xl animate-pulse"></div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 drop-shadow-lg">
                        {t('title')}
                    </h1>

                    <div className="bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/10 p-8 md:p-12 shadow-glass relative overflow-hidden group">
                        {/* Decorative background elements */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl group-hover:bg-accent-500/20 transition duration-700"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition duration-700"></div>

                        <h2 className="text-3xl font-bold text-accent-400 mb-4 tracking-wide uppercase">
                            {t('comingSoon')}
                        </h2>

                        <p className="text-xl text-primary-200 leading-relaxed mb-8">
                            {t('description')}
                        </p>

                        <div className="flex justify-center">
                            <Link
                                href="/"
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all hover:scale-105 active:scale-95"
                            >
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
