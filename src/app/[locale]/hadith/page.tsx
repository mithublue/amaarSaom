import { getAllHadiths } from '@/lib/hadithService';
import HadithClient from './HadithClient';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'HadithPage' });

    return {
        title: t('metaTitle'),
        description: t('metaDesc'),
    };
}

export default async function HadithPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();
    const hadiths = getAllHadiths();

    return (
        <HadithClient initialHadiths={hadiths} session={session} locale={locale} />
    );
}
