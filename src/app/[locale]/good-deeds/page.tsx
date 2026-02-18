import { Link } from '@/i18n/routing';
import GoodDeedsClient from './GoodDeedsClient';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default function GoodDeedsPage() {
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
                    <h1 className="text-2xl font-bold text-white flex-1">Good Deeds Manager ✨</h1>
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
