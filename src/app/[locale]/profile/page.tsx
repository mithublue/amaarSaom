import { Metadata } from 'next';
import ProfileClient from './ProfileClient';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'My Profile | Nuzul',
    description: 'Manage your profile and location settings',
};

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/profile`);
    }

    return (
        <ProfileClient user={session!.user} locale={locale} />
    );
}
