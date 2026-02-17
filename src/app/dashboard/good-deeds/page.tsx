import Link from 'next/link';

export default async function GoodDeedsPage() {
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
                    <h1 className="text-2xl font-bold text-white">Good Deeds Manager ✨</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Stats Card */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
                            <div className="text-3xl font-bold text-accent mb-1">0</div>
                            <div className="text-primary-100">Total Points</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
                            <div className="text-3xl font-bold text-secondary mb-1">0</div>
                            <div className="text-primary-100">Deeds Today</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
                            <div className="text-3xl font-bold text-accent mb-1">0</div>
                            <div className="text-primary-100">Day Streak</div>
                        </div>
                    </div>

                    {/* Good Deeds List */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Track Your Good Deeds</h2>
                        <p className="text-center text-primary-100 mb-6">
                            Good deeds tracking feature coming soon! You'll be able to log prayers, charity, Quran reading, and more.
                        </p>

                        {/* Placeholder Deeds */}
                        <div className="space-y-3">
                            {[
                                { name: 'Pray 5 Daily Prayers', points: 50, icon: '🕌' },
                                { name: 'Read Quran (10 min)', points: 20, icon: '📖' },
                                { name: 'Give Charity', points: 30, icon: '💝' },
                                { name: 'Help Someone', points: 25, icon: '🤝' },
                            ].map((deed, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{deed.icon}</span>
                                        <span className="text-white font-medium">{deed.name}</span>
                                    </div>
                                    <span className="text-accent font-bold">+{deed.points} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
