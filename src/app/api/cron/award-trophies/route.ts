import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { calculateUserLevel } from '@/lib/gamification';
import { startOfMonth } from 'date-fns';

/**
 * GET/POST /api/cron/award-trophies
 * Awards trophies to all users for the current month based on their season points.
 * Must be protected via CRON_SECRET or Admin auth.
 */
export async function GET(request: NextRequest) {
    try {
        // Enforce secret authorization
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const monthStart = startOfMonth(now);
        const monthStartStr = `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}-${pad(monthStart.getDate())}`;

        // Month string identifier for the Trophy (e.g., "March 2024")
        const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Fetch user total points for this particular period
        const query = `
            SELECT cd.user_id as userId, SUM(cd.total_points) as totalPoints
            FROM completed_deeds cd
            WHERE DATE(cd.completed_at) >= '${monthStartStr}'
            GROUP BY cd.user_id
            HAVING totalPoints > 0
        `;

        const userScores = await prisma.$queryRawUnsafe<any[]>(query);

        if (!userScores.length) {
            return NextResponse.json({ success: true, message: 'No users with points this month.' });
        }

        let trophiesAwarded = 0;

        // Process in batches (if large database)
        for (const record of userScores) {
            const userId = Number(record.userId);
            const totalPoints = Number(record.totalPoints);
            const userLevel = calculateUserLevel(totalPoints);

            // Check if already awarded for this month to prevent duplicates
            const existingTrophy = await prisma.userTrophy.findFirst({
                where: {
                    userId,
                    monthName
                }
            });

            if (!existingTrophy) {
                await prisma.userTrophy.create({
                    data: {
                        userId,
                        level: userLevel.level,
                        monthName,
                        monthDate: monthStart,
                        points: totalPoints,
                    }
                });
                trophiesAwarded++;

                // (Optional) Send push notification
                // await sendNotification(userId, `Alhamdulillah! You finished ${monthName} at Level ${userLevel.level}: ${gT('levels.' + userLevel.nameKey)}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Awarded ${trophiesAwarded} trophies for ${monthName}.`
        });
    } catch (error) {
        console.error('Error awarding trophies:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
