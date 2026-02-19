import { Metadata } from 'next';
import ProfileClient from './ProfileClient';
import { auth } from '@/lib/auth/config';
import { redirect } from '@/i18n/routing';

export const metadata: Metadata = {
    title: 'My Profile | Ramadan Companion',
    description: 'Manage your profile and location settings',
};

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect({ href: '/api/auth/signin', locale });
    }

    return (
        <ProfileClient user={session!.user} locale={locale} />
    );
}
