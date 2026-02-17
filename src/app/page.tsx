import Link from 'next/link';
import { auth } from '@/lib/auth/config';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          {/* App Icon/Logo */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-secondary shadow-2xl flex items-center justify-center">
              <span className="text-5xl">🌙</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
            Ramadan Companion
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-8">
            Your spiritual journey partner this Ramadan
          </p>
          <p className="text-lg text-primary-200 mb-12">
            Track prayers, complete good deeds, compete with your community, and strengthen your faith
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {session ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Go to Dashboard 🚀
              </Link>
            ) : (
              <>
                <Link
                  href="/api/auth/signin"
                  className="px-8 py-4 bg-gradient-to-r from-accent to-secondary text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Sign in with Google
                </Link>
                <Link
                  href="#features"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border-2 border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  Learn More
                </Link>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-primary-200">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">30+</div>
              <div className="text-primary-200">Good Deeds</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">5</div>
              <div className="text-primary-200">Daily Prayers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">∞</div>
              <div className="text-primary-200">Rewards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-primary-300">
        <p>Made with ❤️ for the Muslim Ummah</p>
        <p className="text-sm mt-2">Ramadan Mubarak! 🌙✨</p>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: '🕌',
    title: 'Prayer Times',
    description: 'Accurate prayer times with countdown timers for Iftar and Sahri',
  },
  {
    icon: '✨',
    title: 'Good Deeds Tracker',
    description: 'Track and complete good deeds with gamified points system',
  },
  {
    icon: '🏆',
    title: 'Leaderboard',
    description: 'Compete with your community - district, division, and national rankings',
  },
  {
    icon: '🎯',
    title: 'Goals & Streaks',
    description: 'Set daily, weekly, and monthly goals. Build prayer streaks!',
  },
  {
    icon: '⭐',
    title: 'Power Days',
    description: '2x points on Fridays and the last 10 nights of Ramadan',
  },
  {
    icon: '📖',
    title: 'Quran & Duas',
    description: 'Daily Hadith, supplications, and Quranic verses',
  },
];

