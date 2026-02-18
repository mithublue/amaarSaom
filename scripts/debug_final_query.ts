
import { prisma } from '@/lib/db/prisma';

async function main() {
    console.log('Testing SQL Variations...');

    const baseQuery = `
    SELECT u.id as userId, MAX(u.name) as userName, SUM(cd.total_points) as totalPoints
    FROM completed_deeds cd
    JOIN users u ON cd.user_id = u.id
    GROUP BY u.id
  `;

    // Variant 1: Order by Alias
    try {
        const q1 = `${baseQuery} ORDER BY totalPoints DESC LIMIT 5`;
        const r1 = await prisma.$queryRawUnsafe(q1);
        console.log('Variant 1 (Alias): Success', r1.length);
    } catch (e) {
        console.error('Variant 1 Failed:', e.message);
    }

    // Variant 2: Order by Aggregate
    try {
        const q2 = `${baseQuery} ORDER BY SUM(cd.total_points) DESC LIMIT 5`;
        const r2 = await prisma.$queryRawUnsafe(q2);
        console.log('Variant 2 (Aggregate): Success', r2.length);
    } catch (e) {
        console.error('Variant 2 Failed:', e.message);
    }

    await prisma.$disconnect();
}

main();
