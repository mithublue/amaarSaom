import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';
import HomeWidgets from '@/components/home/HomeWidgets';

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
        { key: 'zakat', href: 'https://assunnahfoundation.org/zakat-calculator', icon: '💰', color: 'bg-green-600' },
    ];

    const firstName = session?.user?.name?.split(' ')[0];

    return (
        <main className="min-h-screen bg-primary-950 text-white selection:bg-accent-500 selection:text-white">
            <Navbar session={session} locale={locale} />

            {/* Hero Section */}
            <section className="relative pt-24 pb-12 px-4 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5 pointer-events-none"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-accent-500/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <HomeWidgets
                        userName={firstName}
                        locale={locale}
                        isGuest={!session}
                    />
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-12 px-4 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {features.map((feature, idx) => {
                            const isExternal = feature.href.startsWith('http');
                            const Comp = isExternal ? 'a' : Link;
                            const props = isExternal
                                ? { href: feature.href, target: "_blank", rel: "noopener noreferrer" } as any
                                : { href: feature.href };

                            return (
                                <Comp
                                    key={feature.key}
                                    {...props}
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
                                </Comp>
                            );
                        })}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
