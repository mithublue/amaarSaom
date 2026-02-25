import { Link } from '@/i18n/routing';
import GoodDeedsClient from './GoodDeedsClient';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import { auth } from '@/lib/auth/config';
import Footer from '@/components/layout/Footer';

export default async function GoodDeedsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('GoodDeeds');
    const session = await auth();

    return (
        <div className="min-h-screen flex flex-col font-sans bg-primary-950 text-white">
            <Navbar session={session} locale={locale} />

            <main className="flex-grow container mx-auto px-4 py-8 mt-24">
                <div className="max-w-6xl mx-auto">
                    <GoodDeedsClient />
                </div>
            </main>

            <Footer language={locale as any} />
        </div>
    );
}
