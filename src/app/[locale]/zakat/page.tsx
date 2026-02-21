import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/config';
import ZakatCalculatorClient from './ZakatClient';
import Navbar from '@/components/layout/Navbar';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return {
        title: 'যাকাত ক্যালকুলেটর — Nuzul',
        description: 'ধাপে ধাপে সহজে যাকাত হিসাব করুন। সোনা, রূপা, নগদ ও ব্যবসায়িক সম্পদ সহ বিস্তারিত হিসাব।',
    };
}

export default async function ZakatPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();

    return (
        <div className="min-h-screen bg-primary-950">
            <Navbar session={session} locale={locale} />
            <main className="pt-20 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Page header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-900/40 border border-emerald-500/20 text-3xl mb-4">
                            🕌
                        </div>
                        <h1 className="text-3xl font-bold text-white">যাকাত ক্যালকুলেটর</h1>
                        <p className="text-primary-400 mt-2 text-sm">
                            ধাপে ধাপে সহজে যাকাত হিসাব করুন
                        </p>
                    </div>

                    <ZakatCalculatorClient />
                </div>
            </main>

            {/* Print styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #zakat-result-print, #zakat-result-print * { visibility: visible; }
                    #zakat-result-print { position: absolute; top: 0; left: 0; width: 100%; padding: 2rem; }
                    .print\\:hidden { display: none !important; }
                    body { background: white; color: black; }
                }
            `}</style>
        </div>
    );
}
