import Link from 'next/link';
import HadithClient from './HadithClient';
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
                    {/* Hadith Component */}
                    <HadithClient />

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
