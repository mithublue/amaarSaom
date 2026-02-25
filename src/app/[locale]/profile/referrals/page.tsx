import { auth } from '@/lib/auth/config';
import { getReferralStats, getReferredUsers, generateReferralCode } from '@/lib/services/referralService';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import ReferralsClient from './ReferralsClient';

export default async function ProfileReferralsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        redirect(`/${locale}/auth/signin`);
    }

    const userId = parseInt(session.user.id);
    if (isNaN(userId)) redirect(`/${locale}/auth/signin`);

    let user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true }
    });

    // Auto-generate referral code for existing users who don't have one
    if (!user?.referralCode) {
        let code = generateReferralCode();
        let attempts = 0;
        while (attempts < 5) {
            const existing = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
            if (!existing) break;
            code = generateReferralCode();
            attempts++;
        }
        user = await prisma.user.update({
            where: { id: userId },
            data: { referralCode: code },
            select: { referralCode: true }
        });
    }

    const [stats, referrals] = await Promise.all([
        getReferralStats(userId),
        getReferredUsers(userId)
    ]);

    return (
        <ReferralsClient
            referralCode={user?.referralCode || ''}
            stats={stats}
            referrals={referrals}
            locale={locale}
        />
    );
}
