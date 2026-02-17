import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { auth } from '@/lib/auth/config';

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌙</span>
            <h1 className="text-2xl font-bold text-white">Ramadan Companion</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary-100">
              {session?.user?.name || 'Guest User'}
            </span>
            <Link
              href="/profile"
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2"
            >
              <span>👤</span> Profile
            </Link>
            {session && (
              <Link
                href="/api/auth/signout"
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Sign Out
              </Link>
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
                <>Assalamu Alaikum, {session.user?.name?.split(' ')[0]}! 👋</>
              ) : (
                <>Assalamu Alaikum! 👋</>
              )}
            </h2>
            <p className="text-xl text-primary-100">
              May this Ramadan bring you peace, blessings, and spiritual growth
            </p>
          </div>

          {/* Sign In Prompt for Unauthenticated Users */}
          {!session && (
            <div className="mb-12 bg-accent/20 backdrop-blur-md rounded-3xl border border-accent/30 p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                🔒 Sign In to Start Your Journey
              </h3>
              <p className="text-primary-200 mb-6">
                Track your prayers, complete good deeds, and compete with your community!
              </p>
              <Link
                href="/auth/signin"
                className="inline-block px-8 py-4 bg-accent text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Sign In with Google 🚀
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
      <Footer language={session?.user?.language || 'en'} />
    </div>
  );
}

const features = [
  {
    icon: '🕌',
    title: 'Prayer Times',
    description: 'View accurate prayer times for your location',
    href: '/prayer-times',
  },
  {
    icon: '🌅',
    title: 'Iftar & Sehri',
    description: 'Countdown timers for Iftar and Sehri',
    href: '/iftar-sehri',
  },
  {
    icon: '✨',
    title: 'Good Deeds',
    description: 'Track and manage your daily good deeds',
    href: '/good-deeds',
  },
  {
    icon: '📖',
    title: 'Daily Hadith',
    description: 'Read authentic Hadith daily for inspiration',
    href: '/hadith',
  },
  {
    icon: '🤲',
    title: 'Duas & Amal',
    description: 'Essential duas and spiritual practices',
    href: '/duas',
  },
  {
    icon: '📕',
    title: 'Quran',
    description: 'Read and reflect on the Holy Quran',
    href: '/quran',
  },
];
