import Link from 'next/link';
import { auth } from '@/lib/auth/config';

export default async function HadithPage() {

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-white hover:text-accent transition"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Daily Hadith 📖</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Hadith of the Day */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 mb-6">
                        <div className="text-center mb-6">
                            <span className="text-5xl block mb-4">📖</span>
                            <h2 className="text-2xl font-bold text-white mb-2">Hadith of the Day</h2>
                            <p className="text-primary-200 text-sm">Day {new Date().getDate()} of Ramadan</p>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-6 mb-4">
                            <p className="text-white text-lg italic leading-relaxed text-center mb-4">
                                "The best of you are those who learn the Quran and teach it."
                            </p>
                            <p className="text-primary-200 text-sm text-center">
                                — Prophet Muhammad ﷺ (Sahih Bukhari)
                            </p>
                        </div>

                        <div className="text-center">
                            <button className="px-6 py-2 bg-accent text-white rounded-xl hover:bg-accent/80 transition">
                                Share Hadith
                            </button>
                        </div>
                    </div>

                    {/* Browse More */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Browse More Hadith</h3>
                        <p className="text-primary-100 text-center">
                            More authentic Hadith collection coming soon! Browse by topic, collection, and bookmark your favorites.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
