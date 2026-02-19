import { getAllHadiths, getHadithById } from '@/lib/hadithService';
import HadithClient from '../HadithClient';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/config';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; hadithId: string }> }) {
    const { locale, hadithId } = await params;
    const hadith = getHadithById(parseInt(hadithId));

    if (!hadith) {
        return {
            title: 'Hadith Not Found',
        };
    }

    return {
        title: `Hadith #${hadith.id} | Ramadan Companion`,
        description: hadith.textEn.substring(0, 150) + '...',
        openGraph: {
            title: `Hadith - ${hadith.source}`,
            description: hadith.textEn.substring(0, 150) + '...',
            // images: ['/og-image.png'], // If you have one
        },
    };
}

export default async function HadithDetailPage({ params }: { params: Promise<{ locale: string; hadithId: string }> }) {
    const { locale, hadithId } = await params;
    const session = await auth();
    const hadiths = getAllHadiths();
    const hadith = getHadithById(parseInt(hadithId));

    if (!hadith) {
        notFound();
    }

    return (
        <HadithClient
            initialHadiths={hadiths}
            session={session}
            locale={locale}
            highlightedHadith={hadith}
        />
    );
}
