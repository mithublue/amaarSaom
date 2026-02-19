import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('HomePage');
    const session = await auth();

    const features = [
        { key: 'prayerTimes', href: '/prayer-times', icon: '🕌', color: 'bg-emerald-600' },
        { key: 'iftarSehri', href: '/iftar-sehri', icon: '🌙', color: 'bg-indigo-600' },
        { key: 'goodDeeds', href: '/good-deeds', icon: '✨', color: 'bg-amber-600' },
        { key: 'quran', href: '/quran', icon: '📖', color: 'bg-teal-600' },
        { key: 'hadith', href: '/hadith', icon: '📜', color: 'bg-cyan-600' },
        { key: 'duas', href: '/duas', icon: '🤲', color: 'bg-sky-600' },
        { key: 'leaderboard', href: '/leaderboard', icon: '🏆', color: 'bg-yellow-600' },
        { key: 'zakat', href: '/zakat', icon: '💰', color: 'bg-green-600' },
    ];

    const firstName = session?.user?.name?.split(' ')[0];

    return (
        <main className="min-h-screen bg-primary-950 text-white selection:bg-accent-500 selection:text-white">
            <Navbar session={session} locale={locale} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5 pointer-events-none"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-accent-500/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight text-white">
                        {t('greeting')}{firstName ? <>, <span className="text-accent-400">{firstName}!</span></> : ''} 👋
                    </h1>
                    <p className="text-lg md:text-2xl text-primary-200 mb-10 max-w-2xl mx-auto leading-relaxed">
                        {t('welcomeMessage')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {session ? (
                            <Link href="/prayer-times" className="px-8 py-4 bg-accent-600 hover:bg-accent-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-accent-500/25 flex items-center justify-center gap-2 transform hover:scale-105">
                                <span>🕌</span> {t('features.prayerTimes.title')}
                            </Link>
                        ) : (
                            <Link href="/api/auth/signin" className="px-8 py-4 bg-accent-600 hover:bg-accent-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-accent-500/25 flex items-center justify-center gap-2 transform hover:scale-105">
                                {t('signInButton')}
                            </Link>
                        )}
                        <Link href="/iftar-sehri" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold transition-all backdrop-blur-sm border border-white/10 flex items-center justify-center gap-2 hover:border-white/20">
                            <span>🌙</span> {t('features.iftarSehri.title')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <Link
                                key={feature.key}
                                href={feature.href}
                                className="group bg-primary-900/40 backdrop-blur-md border border-white/5 hover:border-accent-500/30 rounded-2xl p-6 transition-all duration-300 hover:bg-primary-900/60 hover:-translate-y-1 shadow-glass hover:shadow-glow"
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.color} bg-opacity-20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-400 transition-colors">
                                    {t(`features.${feature.key}.title`)}
                                </h3>
                                <p className="text-primary-300 text-sm leading-relaxed">
                                    {t(`features.${feature.key}.desc`)}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
