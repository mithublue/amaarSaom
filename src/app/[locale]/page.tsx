import { Link } from '@/i18n/routing';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

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
    },
    {
      icon: '🌅',
      title: t('features.iftarSehri.title'),
      description: t('features.iftarSehri.desc'),
      href: '/iftar-sehri',
    },
    {
      icon: '✨',
      title: t('features.goodDeeds.title'),
      description: t('features.goodDeeds.desc'),
      href: '/good-deeds',
    },
    {
      icon: '📖',
      title: t('features.hadith.title'),
      description: t('features.hadith.desc'),
      href: '/hadith',
    },
    {
      icon: '🤲',
      title: t('features.duas.title'),
      description: t('features.duas.desc'),
      href: '/duas',
    },
    {
      icon: '📕',
      title: t('features.quran.title'),
      description: t('features.quran.desc'),
      href: '/quran',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌙</span>
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
            <LanguageSwitcher />
            <span className="text-primary-100 text-sm md:text-base">
              {session?.user?.name || t('guest')}
            </span>
            <Link
              href="/profile"
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2 text-sm md:text-base"
            >
              <span>👤</span> {t('profile')}
            </Link>
            {session && (
              <a
                href={`/api/auth/signout?callbackUrl=/${locale}`}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm md:text-base"
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
              {session ? (
                <>{t('greeting')}, {session.user?.name?.split(' ')[0]}! 👋</>
              ) : (
                <>{t('greeting')}! 👋</>
              )}
            </h2>
            <p className="text-xl text-primary-100">
              {t('welcomeMessage')}
            </p>
          </div>

          {/* Sign In Prompt for Unauthenticated Users */}
          {!session && (
            <div className="mb-12 bg-accent/20 backdrop-blur-md rounded-3xl border border-accent/30 p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                {t('signInTitle')}
              </h3>
              <p className="text-primary-200 mb-6">
                {t('signInDesc')}
              </p>
              <Link
                href="/auth/signin"
                className="inline-block px-8 py-4 bg-accent text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
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
                className="group relative p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 hover:bg-white/15 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                {/* Icon */}
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
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
      <Footer language={locale as any} />
    </div>
  );
}
