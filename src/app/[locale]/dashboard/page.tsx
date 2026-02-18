import { Link } from '@/i18n/routing';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
    const session = await auth();
    const t = await getTranslations('Dashboard');
    const tHome = await getTranslations('HomePage'); // Reuse feature strings from HomePage if possible, or Dashboard

    // We can reuse the feature strings from HomePage common keys if they are the same
    // Or we can duplicate them in Dashboard namespace if they differ.
    // For now, let's assume they are similar.

    // Actually, looking at en.json, I put them under HomePage.features. 
    // I should use HomePage namespace for features or duplicate.
    // Let's use HomePage for features to be consistent.

    const features = [
        {
            icon: '🕌',
            title: tHome('features.prayerTimes.title'),
            description: tHome('features.prayerTimes.desc'),
            href: '/dashboard/prayer-times',
        },
        {
            icon: '🌅',
            title: tHome('features.iftarSehri.title'),
            description: tHome('features.iftarSehri.desc'),
            href: '/dashboard/iftar-sehri',
        },
        {
            icon: '✨',
            title: tHome('features.goodDeeds.title'),
            description: tHome('features.goodDeeds.desc'),
            href: '/dashboard/good-deeds',
        },
        {
            icon: '🏆',
            title: tHome('features.leaderboard.title'),
            description: tHome('features.leaderboard.desc'),
            href: '/leaderboard', // This was missing/broken
        },
        {
            icon: '📖',
            title: tHome('features.hadith.title'),
            description: tHome('features.hadith.desc'),
            href: '/dashboard/hadith',
        },
        {
            icon: '🤲',
            title: tHome('features.duas.title'),
            description: tHome('features.duas.desc'),
            href: '/dashboard/duas',
        },
        {
            icon: '📕',
            title: tHome('features.quran.title'),
            description: tHome('features.quran.desc'),
            href: '/dashboard/quran',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background-dark via-primary-900 to-primary-800">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">🌙</span>
                        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-primary-100">
                            {session?.user?.name || t('guest')}
                        </span>
                        {session && (
                            <a
                                href="/api/auth/signout"
                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                            >
                                {t('signOut')}
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Welcome Section */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-3">
                            {t('greeting')}, {session?.user?.name?.split(' ')[0] || t('greetingSuffix')}! 👋
                        </h2>
                        <p className="text-xl text-primary-100">
                            {t('welcomeMessage')}
                        </p>
                    </div>

                    {/* Feature Blocks Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <Link
                                key={index}
                                href={feature.href}
                                className="group relative p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:bg-white/10 hover:border-accent/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                            >
                                {/* Icon */}
                                <div className="text-6xl mb-4 text-accent group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-300">
                                    {feature.icon}
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-primary-200 mb-4">{feature.description}</p>

                                {/* Arrow Indicator */}
                                <div className="absolute bottom-4 right-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                    →
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer language={session?.user?.language || 'en'} />
        </div>
    );
}
