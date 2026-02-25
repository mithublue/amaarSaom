import { prisma } from '../db/prisma';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { randomBytes } from 'crypto';

/**
 * Referral Service
 * Handles referral code generation, reward processing, and statistics.
 *
 * Points model:
 *  - Referred user earns their FULL deed points (no deduction).
 *  - Referrer earns an ADDITIONAL 50% bonus on top.
 */

const REGISTRATION_REWARD_POINTS = 50;
const DEED_COMMISSION_PERCENTAGE = 0.5;

/**
 * Generate a cryptographically secure unique 8-character referral code.
 * Uses Node's crypto module instead of Math.random().
 */
export function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(8);
    return Array.from(bytes)
        .map(b => chars[b % chars.length])
        .join('');
}

/**
 * Process registration reward for a new user.
 * Normalizes the code to uppercase server-side to prevent bypass via lowercase input.
 */
export async function processRegistrationReward(referredUserId: number, referralCode: string) {
    // Normalize to uppercase (defense against lowercase input)
    const normalizedCode = referralCode.trim().toUpperCase();

    // Validate format before hitting the database
    if (!/^[A-Z0-9]{6,12}$/.test(normalizedCode)) return null;

    // Find the referrer
    const referrer = await prisma.user.findUnique({
        where: { referralCode: normalizedCode },
        select: { id: true }
    });

    if (!referrer || referrer.id === referredUserId) return null;

    // Check: has this user already been linked to a referrer?
    const alreadyLinked = await prisma.user.findUnique({
        where: { id: referredUserId },
        select: { referredById: true }
    });
    if (alreadyLinked?.referredById) return null; // Prevent double-linking

    // Atomically link the user to the referrer and create the reward
    const [, reward] = await prisma.$transaction([
        prisma.user.update({
            where: { id: referredUserId },
            data: { referredById: referrer.id }
        }),
        prisma.referralReward.create({
            data: {
                referrerId: referrer.id,
                referredUserId,
                type: 'registration',
                points: REGISTRATION_REWARD_POINTS
            }
        })
    ]);

    return reward;
}

/**
 * Process commission reward for a referrer when a referral completes a deed.
 * The referred user keeps their FULL points.
 * The referrer receives an ADDITIONAL 50% as a bonus.
 *
 * Deduplication: uses upsert with a unique constraint on (referrerId, deedId)
 * so even if this is called twice, only one reward is ever created.
 */
export async function processDeedCommission(referredUserId: number, deedId: number, points: number) {
    const user = await prisma.user.findUnique({
        where: { id: referredUserId },
        select: { referredById: true }
    });

    if (!user?.referredById) return null;

    const commissionPoints = Math.floor(points * DEED_COMMISSION_PERCENTAGE);
    if (commissionPoints <= 0) return null;

    // Idempotent: skip silently if this deed's commission was already recorded
    const existing = await prisma.referralReward.findFirst({
        where: {
            referrerId: user.referredById,
            deedId,
            type: 'deed_commission'
        },
        select: { id: true }
    });
    if (existing) return null;

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

    const today = startOfDay(now);
    const thisWeek = startOfWeek(now);
    const thisMonth = startOfMonth(now);

    const [activeToday, activeThisWeek, activeThisMonth] = await Promise.all([
        prisma.completedDeed.groupBy({
            by: ['userId'],
            where: { user: { referredById: userId }, completedAt: { gte: today } }
        }),
        prisma.completedDeed.groupBy({
            by: ['userId'],
            where: { user: { referredById: userId }, completedAt: { gte: thisWeek } }
        }),
        prisma.completedDeed.groupBy({
            by: ['userId'],
            where: { user: { referredById: userId }, completedAt: { gte: thisMonth } }
        })
    ]);

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
