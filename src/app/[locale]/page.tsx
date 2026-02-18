import { Link } from '@/i18n/routing';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
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
      gradient: 'from-accent-400/20 to-accent-600/20',
      delay: 'delay-0',
    },
    {
      icon: '🌅',
      title: t('features.iftarSehri.title'),
      description: t('features.iftarSehri.desc'),
      href: '/iftar-sehri',
      gradient: 'from-emerald-400/20 to-emerald-600/20',
      delay: 'delay-75',
    },
    {
      icon: '✨',
      title: t('features.goodDeeds.title'),
      description: t('features.goodDeeds.desc'),
      href: '/good-deeds',
      gradient: 'from-amber-400/20 to-amber-600/20',
      delay: 'delay-100',
    },
    {
      icon: '📖',
      title: t('features.hadith.title'),
      description: t('features.hadith.desc'),
      href: '/hadith',
      gradient: 'from-teal-400/20 to-teal-600/20',
      delay: 'delay-150',
    },
    {
      icon: '🤲',
      title: t('features.duas.title'),
      description: t('features.duas.desc'),
      href: '/duas',
      gradient: 'from-primary-300/20 to-primary-500/20',
      delay: 'delay-200',
    },
    {
      icon: '📕',
      title: t('features.quran.title'),
      description: t('features.quran.desc'),
      href: '/quran',
      gradient: 'from-accent-300/20 to-accent-500/20',
      delay: 'delay-300',
    },
    {
      icon: '💰',
      title: t('features.zakat.title'),
      description: t('features.zakat.desc'),
      href: '/zakat',
      gradient: 'from-yellow-400/20 to-yellow-600/20',
      delay: 'delay-500',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-accent-500 selection:text-white">
      <Navbar session={session} locale={locale} />

      <main className="flex-grow container mx-auto px-4 py-8 mt-24">
        <div className="max-w-6xl mx-auto">
          {/* Hero / Welcome Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block p-4 rounded-full bg-primary-800/20 border border-primary-500/30 mb-8 shadow-glow animate-float">
              <span className="text-5xl">🌙</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 drop-shadow-xl tracking-tight">
              {session ? (
                <>{t('greeting')}, <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">{session.user?.name?.split(' ')[0]}</span>! 👋</>
              ) : (
                <>{t('greeting')}! 👋</>
              )}
            </h2>
            <p className="text-xl md:text-2xl text-primary-200 max-w-3xl mx-auto leading-relaxed font-medium opacity-90">
              {t('welcomeMessage')}
            </p>
          </div>

          {/* Sign In CTA for Guests */}
          {!session && (
            <div className="mb-20 glass-morphism rounded-app-lg border border-accent-500/20 p-10 text-center shadow-glass relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl transition-all duration-700 group-hover:bg-accent-500/20"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl transition-all duration-700 group-hover:bg-primary-500/20"></div>

              <div className="relative z-10">
                <h3 className="text-3xl font-heading font-bold text-white mb-4">
                  {t('signInTitle')}
                </h3>
                <p className="text-primary-200 mb-10 max-w-xl mx-auto text-lg">
                  {t('signInDesc')}
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-2xl shadow-gold-glow hover:shadow-lg hover:scale-105 transition-all duration-300 group/btn"
                >
                  <span>{t('signInButton')}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className={`group relative p-8 bg-primary-900/40 backdrop-blur-md rounded-app-lg border border-white/5 hover:border-accent-500/40 hover:bg-primary-900/70 transition-all duration-500 cursor-pointer shadow-glass overflow-hidden animate-slide-up ${feature.delay}`}
              >
                {/* Floating Background Glow */}
                <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${feature.gradient} blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-700`}></div>

                {/* Visual Content */}
                <div className="relative z-10">
                  <div className="text-6xl mb-8 transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 drop-shadow-md">
                    {feature.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-accent-300 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-primary-300 leading-relaxed font-medium group-hover:text-primary-100 transition-colors">
                    {feature.description}
                  </p>

                  {/* Subtle Gold Border Bottom on Hover */}
                  <div className="absolute -bottom-8 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-500 to-transparent group-hover:w-full transition-all duration-700 delay-100"></div>
                </div>

                {/* Arrow */}
                <div className="absolute bottom-8 right-8 text-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer language={locale as any} />
    </div>
  );
}

