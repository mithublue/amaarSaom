import { Link } from '@/i18n/routing';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar'; // Import Navbar
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations('HomePage');

  const features = [
    {
      icon: '🕌',
      title: t('features.prayerTimes.title'),
      description: t('features.prayerTimes.desc'),
      href: '/prayer-times',
      gradient: 'from-emerald-500/20 to-emerald-600/20',
    },
    {
      icon: '🌅',
      title: t('features.iftarSehri.title'),
      description: t('features.iftarSehri.desc'),
      href: '/iftar-sehri',
      gradient: 'from-amber-500/20 to-orange-600/20',
    },
    {
      icon: '✨',
      title: t('features.goodDeeds.title'),
      description: t('features.goodDeeds.desc'),
      href: '/good-deeds',
      gradient: 'from-teal-500/20 to-cyan-600/20',
    },
    {
      icon: '📖',
      title: t('features.hadith.title'),
      description: t('features.hadith.desc'),
      href: '/hadith',
      gradient: 'from-blue-500/20 to-indigo-600/20',
    },
    {
      icon: '🤲',
      title: t('features.duas.title'),
      description: t('features.duas.desc'),
      href: '/duas',
      gradient: 'from-purple-500/20 to-violet-600/20',
    },
    {
      icon: '📕',
      title: t('features.quran.title'),
      description: t('features.quran.desc'),
      href: '/quran',
      gradient: 'from-emerald-400/20 to-teal-500/20', // Quran Green
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar with Session */}
      <Navbar session={session} locale={locale} />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 mt-24">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 drop-shadow-md">
              {session ? (
                <>{t('greeting')}, <span className="text-accent-400">{session.user?.name?.split(' ')[0]}</span>! 👋</>
              ) : (
                <>{t('greeting')}! 👋</>
              )}
            </h2>
            <p className="text-xl text-primary-200 max-w-2xl mx-auto leading-relaxed">
              {t('welcomeMessage')}
            </p>
          </div>

          {/* Sign In Prompt for Unauthenticated Users */}
          {!session && (
            <div className="mb-16 bg-gradient-to-br from-primary-900/80 to-primary-800/80 backdrop-blur-md rounded-app-lg border border-accent-500/30 p-8 text-center shadow-glass relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10">
                {t('signInTitle')}
              </h3>
              <p className="text-primary-200 mb-8 max-w-lg mx-auto relative z-10">
                {t('signInDesc')}
              </p>
              <Link
                href="/auth/signin"
                className="relative z-10 inline-block px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl shadow-gold-glow hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                {t('signInButton')}
              </Link>
            </div>
          )}

          {/* Feature Blocks Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group relative p-8 bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/5 hover:border-accent-500/30 hover:bg-primary-900/60 transition-all duration-300 cursor-pointer shadow-glass overflow-hidden"
              >
                {/* Gradient Blob Background */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${feature.gradient} blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`}></div>

                {/* Icon */}
                <div className="text-5xl mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3 relative z-10 group-hover:text-accent-300 transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-primary-300 mb-4 relative z-10 leading-relaxed group-hover:text-primary-100 transition-colors">
                  {feature.description}
                </p>

                {/* Arrow Indicator */}
                <div className="absolute bottom-6 right-6 text-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer language={locale as any} />
    </div>
  );
}
