import { Link } from '@/i18n/routing';
import GoodDeedsClient from './GoodDeedsClient';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default function GoodDeedsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background-default via-primary-50 to-primary-100">
            {/* Header */}
            <header className="bg-white/50 backdrop-blur-md border-b border-gray-200/50">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-primary-700 hover:text-accent transition"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-primary-900 flex-1">Good Deeds Manager ✨</h1>
                    <LanguageSwitcher />
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <GoodDeedsClient />
            </main>
        </div>
    );
}
