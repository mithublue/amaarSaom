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

    if (!session) {
        redirect({ href: '/auth/signin', locale });
        return null;
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 pb-20">
            <div className="container mx-auto px-4 py-8">
                <ProfileClient user={session.user} />
            </div>
        </main>
    );
}
