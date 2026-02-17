import { Metadata } from 'next';
import LeaderboardClient from './LeaderboardClient';
import Link from 'next/link';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Community Leaderboard | Ramadan Companion',
    description: 'Compete for good deeds and track your spiritual progress',
};

export default async function LeaderboardPage() {
    const session = await auth();

    if (!session) {
        redirect('/auth/signin');
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 pb-20">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/"
                        className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        Community Leaderboard 🏆
                    </h1>
                </div>

                <LeaderboardClient />
            </div>
        </main>
    );
}
