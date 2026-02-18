import { auth } from '@/lib/auth/config';
import Link from 'next/link';
import DuasClient from './DuasClient';
import englishData from '@/app/api/json/hisnul_muslim-en.json';
// Import other languages if available, or handle dynamic loading if strict requirement.
// For now, loading English to match the user's explicit json file mention.

export default async function DuasPage() {
    const session = await auth();
    const language = (session?.user?.language as 'en' | 'bn' | 'ar') || 'en';

    // Map language to data source if multiple files exist.
    // Assuming for now we use the english one as base or the one specified.
    // The user showed 'hisnul_muslim-en.json', implying 'en'.
    // If 'bn' or 'ar' are needed, we would import them too.
    const data = englishData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-white hover:text-accent transition"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Duas & Amal 🤲</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <DuasClient language={language} data={data as any} />
            </main>
        </div>
    );
}
