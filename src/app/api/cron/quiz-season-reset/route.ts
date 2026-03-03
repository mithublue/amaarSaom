import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentHijriMonth } from '@/lib/hijriUtils';

/**
 * GET /api/cron/quiz-season-reset
 * Runs at the start of each Hijri month (scheduled in vercel.json).
 * For every user with seasonQuizPoints > 0:
 *   1. Determines their season rank globally.
 *   2. Awards a QuizTrophy recording their season score & rank.
 *   3. Resets seasonQuizPoints to 0.
 *   4. Updates currentHijriMonth on the UserQuizProfile.
 *   5. Clears (deletes) the QuizLeaderboardCache rows for the old season.
 */
export async function GET(request: NextRequest) {
    try {
        // Auth check
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newHijriMonth = getCurrentHijriMonth();

        // Fetch all profiles that are not yet on the new month and have season points
        const profiles = await prisma.userQuizProfile.findMany({
            where: {
                seasonQuizPoints: { gt: 0 },
                currentHijriMonth: { not: newHijriMonth },
            },
            orderBy: { seasonQuizPoints: 'desc' },
        });

        if (profiles.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No season points to reset — all profiles already on new Hijri month.',
            });
        }

        let trophiesAwarded = 0;

        for (let i = 0; i < profiles.length; i++) {
            const profile = profiles[i];
            const rank = i + 1; // 1-indexed global rank at season end
            const oldHijriMonth = profile.currentHijriMonth ?? 'Unknown';

            // 1. Check if trophy already awarded for this season (idempotency)
            const existingTrophy = await prisma.quizTrophy.findFirst({
                where: { userId: profile.userId, hijriMonth: oldHijriMonth },
            });

            if (!existingTrophy) {
                // 2. Award QuizTrophy
                await prisma.quizTrophy.create({
                    data: {
                        userId: profile.userId,
                        hijriMonth: oldHijriMonth,
                        seasonPoints: profile.seasonQuizPoints,
                        rank,
                    },
                });
                trophiesAwarded++;
            }

            // 3. Reset seasonQuizPoints + update currentHijriMonth
            await prisma.userQuizProfile.update({
                where: { id: profile.id },
                data: {
                    seasonQuizPoints: 0,
                    currentHijriMonth: newHijriMonth,
                },
            });
        }

        // 4. Clear old season QuizLeaderboardCache rows so new season starts fresh
        const deletedCache = await prisma.quizLeaderboardCache.deleteMany({
            where: { period: 'season', hijriMonth: { not: newHijriMonth } },
        });

        return NextResponse.json({
            success: true,
            newHijriMonth,
            profilesProcessed: profiles.length,
            trophiesAwarded,
            cacheRowsDeleted: deletedCache.count,
        });
    } catch (error) {
        console.error('[quiz-season-reset] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Allow POST as well so it can be triggered manually from admin panel
export { GET as POST };
