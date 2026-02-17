import Link from 'next/link';
import { auth } from '@/lib/auth/config';

export default async function QuranPage() {
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
                    <h1 className="text-2xl font-bold text-white">Holy Quran 📕</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Reading Progress */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">
                            Your Reading Progress
                        </h2>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-primary-100">Ramadan Progress</span>
                            <span className="text-white font-bold">0 / 30 Juz</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-4">
                            <div className="bg-gradient-to-r from-accent to-secondary h-4 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition cursor-pointer">
                            <div className="text-4xl mb-3">📖</div>
                            <h3 className="text-xl font-bold text-white mb-2">Continue Reading</h3>
                            <p className="text-primary-200">Resume from where you left off</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition cursor-pointer">
                            <div className="text-4xl mb-3">🔖</div>
                            <h3 className="text-xl font-bold text-white mb-2">My Bookmarks</h3>
                            <p className="text-primary-200">View your saved verses</p>
                        </div>
                    </div>

                    {/* Browse Surahs */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                        <h3 className="text-2xl font-bold text-white mb-6">Browse Surahs</h3>
                        <p className="text-center text-primary-100 mb-6">
                            Full Quran with translations, audio, and tafsir coming soon!
                        </p>

                        {/* Sample Surahs */}
                        <div className="space-y-3">
                            {[
                                { number: 1, name: 'Al-Fatihah', meaning: 'The Opening', verses: 7 },
                                { number: 2, name: 'Al-Baqarah', meaning: 'The Cow', verses: 286 },
                                { number: 36, name: 'Ya-Sin', meaning: 'Ya-Sin', verses: 83 },
                                { number: 55, name: 'Ar-Rahman', meaning: 'The Merciful', verses: 78 },
                            ].map((surah) => (
                                <div
                                    key={surah.number}
                                    className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent font-bold">
                                            {surah.number}
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">{surah.name}</div>
                                            <div className="text-primary-200 text-sm">{surah.meaning}</div>
                                        </div>
                                    </div>
                                    <div className="text-primary-200 text-sm">{surah.verses} verses</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
