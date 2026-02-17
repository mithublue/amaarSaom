import Link from 'next/link';
import { auth } from '@/lib/auth/config';

export default async function PrayerTimesPage() {
    const session = await auth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="text-white hover:text-accent transition"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Prayer Times 🕌</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                        <h2 className="text-3xl font-bold text-white mb-6 text-center">
                            Today's Prayer Times
                        </h2>
                        <p className="text-center text-primary-100 mb-8">
                            Prayer times feature coming soon! This will display accurate times for Fajr, Dhuhr, Asr, Maghrib, and Isha.
                        </p>

                        {/* Placeholder for prayer times */}
                        <div className="space-y-4">
                            {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                                <div
                                    key={prayer}
                                    className="flex justify-between items-center p-4 bg-white/5 rounded-xl"
                                >
                                    <span className="text-xl font-semibold text-white">{prayer}</span>
                                    <span className="text-lg text-accent">--:--</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
