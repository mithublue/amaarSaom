import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import QuizClient from './QuizClient';

export const metadata = {
    title: 'Daily Quiz – Brain Battle | Nuzul',
    description: 'Test your Islamic knowledge every day. Speed-based quiz with streaks, lifelines, and a dedicated leaderboard.',
};

export default async function QuizPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/${locale}/auth/signin`);
    }

    return <QuizClient locale={locale} />;
}
