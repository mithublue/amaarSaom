import { prisma } from '../db/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Referral Service
 * Handles referral code generation, reward processing, and statistics
 */

const REGISTRATION_REWARD_POINTS = 50;
const DEED_COMMISSION_PERCENTAGE = 0.5;

/**
 * Generate a unique referral code for a user
 */
export function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Process registration reward for a new user
 */
export async function processRegistrationReward(referredUserId: number, referralCode: string) {
    // Find the referrer
    const referrer = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true }
    });

    if (!referrer || referrer.id === referredUserId) return null;

    // Link the user to the referrer
    await prisma.user.update({
        where: { id: referredUserId },
        data: { referredById: referrer.id }
    });

    // Create the registration reward
    return await prisma.referralReward.create({
        data: {
            referrerId: referrer.id,
            referredUserId,
            type: 'registration',
            points: REGISTRATION_REWARD_POINTS
        }
    });
}

/**
 * Process commission reward for a referrer when a referral completes a deed
 */
export async function processDeedCommission(referredUserId: number, deedId: number, points: number) {
    const user = await prisma.user.findUnique({
        where: { id: referredUserId },
        select: { referredById: true }
    });

    if (!user || !user.referredById) return null;

    const commissionPoints = Math.floor(points * DEED_COMMISSION_PERCENTAGE);
    if (commissionPoints <= 0) return null;

    return await prisma.referralReward.create({
        data: {
            referrerId: user.referredById,
            referredUserId,
            type: 'deed_commission',
            points: commissionPoints,
            deedId
        }
    });
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: number) {
    const now = new Date();

    const [totalReferrals, totalPointsResult] = await Promise.all([
        prisma.user.count({ where: { referredById: userId } }),
        prisma.referralReward.aggregate({
            where: { referrerId: userId },
            _sum: { points: true }
        })
    ]);

    // Track active referrals
    const today = startOfDay(now);
    const thisWeek = startOfWeek(now);
    const thisMonth = startOfMonth(now);

    const activeToday = await prisma.completedDeed.groupBy({
        by: ['userId'],
        where: {
            user: { referredById: userId },
            completedAt: { gte: today }
        }
    });

    const activeThisWeek = await prisma.completedDeed.groupBy({
        by: ['userId'],
        where: {
            user: { referredById: userId },
            completedAt: { gte: thisWeek }
        }
    });

    const activeThisMonth = await prisma.completedDeed.groupBy({
        by: ['userId'],
        where: {
            user: { referredById: userId },
            completedAt: { gte: thisMonth }
        }
    });

    return {
        totalReferrals,
        totalPoints: totalPointsResult._sum.points || 0,
        activeToday: activeToday.length,
        activeThisWeek: activeThisWeek.length,
        activeThisMonth: activeThisMonth.length
    };
}

/**
 * Get list of referred users with their details and earnings
 */
export async function getReferredUsers(userId: number) {
    const referrals = await prisma.user.findMany({
        where: { referredById: userId },
        select: {
            id: true,
            name: true,
            image: true,
            createdAt: true,
            referralRewardsGiven: {
                where: { referrerId: userId },
                select: { points: true }
            },
            completedDeeds: {
                orderBy: { completedAt: 'desc' },
                take: 1,
                select: { completedAt: true }
            }
        }
    });

    return referrals.map(ref => ({
        id: ref.id,
        name: ref.name,
        image: ref.image,
        joinedAt: ref.createdAt,
        totalEarnedForReferrer: ref.referralRewardsGiven.reduce((sum, r) => sum + r.points, 0),
        lastActive: ref.completedDeeds[0]?.completedAt || null
    }));
}
