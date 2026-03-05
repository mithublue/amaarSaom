import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { getCurrentHijriMonth } from '@/lib/hijriUtils';

/**
 * GET /api/quiz/leaderboard
 * Returns the QUIZ-SPECIFIC leaderboard (completely separate from deeds leaderboard).
 * Supports period=season|overall and scope=global|country|division|district
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id ? parseInt(session.user.id) : null;

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'season';
        const scope = searchParams.get('scope') || 'global';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const hijriMonth = period === 'season' ? getCurrentHijriMonth() : undefined;

        // Build scope filter
        let scopeId = 0;
        if (scope !== 'global' && userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { countryId: true, divisionId: true, districtId: true },
            });
            if (user) {
                if (scope === 'country') scopeId = user.countryId || 0;
                if (scope === 'division') scopeId = user.divisionId || 0;
                if (scope === 'district') scopeId = user.districtId || 0;
            }
        }

        // Fetch leaderboard entries with user info
        const entries = await prisma.quizLeaderboardCache.findMany({
            where: {
                period,
                hijriMonth: hijriMonth || null,
                scopeType: scope,
                scopeId,
                totalPoints: { gt: 0 },
            },
            orderBy: { totalPoints: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        districtId: true,
                        divisionId: true,
                        countryId: true,
                    },
                },
            },
        });

        const mapped = entries.map((e, i) => {
            const isMe = userId !== null && e.userId === userId;
            return {
                rank: i + 1,
                userId: e.userId,
                // Show real name only to the user themselves; mask everyone else
                userName: isMe
                    ? (e.user.name || 'You')
                    : `Quiz Player #${i + 1}`,
                userImage: isMe ? e.user.image : null,
                totalPoints: e.totalPoints,
                location: '',
                isMe,
            };
        });

        // User's own rank
        let myRank = null;
        if (userId) {
            const myEntry = await prisma.quizLeaderboardCache.findFirst({
                where: {
                    userId,
                    period,
                    hijriMonth: hijriMonth || null,
                    scopeType: scope,
                    scopeId,
                },
            });
            if (myEntry) {
                const above = await prisma.quizLeaderboardCache.count({
                    where: {
                        period,
                        hijriMonth: hijriMonth || null,
                        scopeType: scope,
                        scopeId,
                        totalPoints: { gt: myEntry.totalPoints },
                    },
                });
                const me = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, image: true },
                });
                myRank = {
                    rank: above + 1,
                    userId,
                    userName: me?.name || 'You',
                    userImage: me?.image || undefined,
                    totalPoints: myEntry.totalPoints,
                    location: '',
                };
            }
        }

        // Also fetch user's quiz profile stats
        let userProfile = null;
        if (userId) {
            userProfile = await prisma.userQuizProfile.findUnique({
                where: { userId },
                select: {
                    currentStreak: true,
                    maxStreak: true,
                    seasonQuizPoints: true,
                    totalQuizPoints: true,
                    currentHijriMonth: true,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                entries: mapped,
                userRank: myRank,
                totalEntries: entries.length,
                period,
                hijriMonth: hijriMonth || null,
                userProfile,
            },
        });
    } catch (error) {
        console.error('[GET /api/quiz/leaderboard]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
