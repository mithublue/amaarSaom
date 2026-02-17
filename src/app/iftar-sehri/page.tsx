import Link from 'next/link';
import { auth } from '@/lib/auth/config';

export default async function IftarSehriPage() {
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
                    <h1 className="text-2xl font-bold text-white">Iftar & Sehri Times 🌅</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Iftar Countdown */}
                        <div className="bg-gradient-to-br from-secondary/20 to-accent/20 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                            <div className="text-center">
                                <span className="text-6xl mb-4 block">🌙</span>
                                <h2 className="text-2xl font-bold text-white mb-2">Time Until Iftar</h2>
                                <div className="text-5xl font-bold text-accent my-6">
                                    --:--:--
                                </div>
                                <p className="text-primary-100">Maghrib: --:--</p>
                            </div>
                        </div>

                        {/* Sehri Countdown */}
                        <div className="bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                            <div className="text-center">
                                <span className="text-6xl mb-4 block">☀️</span>
                                <h2 className="text-2xl font-bold text-white mb-2">Time Until Sehri Ends</h2>
                                <div className="text-5xl font-bold text-accent my-6">
                                    --:--:--
                                </div>
                                <p className="text-primary-100">Fajr: --:--</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="mt-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6">
                        <p className="text-center text-primary-100">
                            Countdown timers feature coming soon! This will show live countdowns to Iftar and Sehri times.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
