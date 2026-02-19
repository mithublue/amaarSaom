import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/config';
import ZakatClient from './ZakatClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ZakatPage' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function ZakatPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();

    return (
        <ZakatClient session={session} locale={locale} />
    );
}
