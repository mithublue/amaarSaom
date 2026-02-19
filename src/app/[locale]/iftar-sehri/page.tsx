import { Link } from '@/i18n/routing';
import { auth } from '@/lib/auth/config';
import IftarSehriClient from './IftarSehriClient';

export default async function IftarSehriPage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="pt-6 pb-2">
                <div className="container mx-auto px-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-primary-100 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                    >
                        <span>←</span> Back
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-white drop-shadow-md">
                        Iftar & Sehri Times 🌅
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <IftarSehriClient />
            </main>
        </div>
    );
}
