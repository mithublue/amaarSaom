
import { prisma } from '@/lib/db/prisma';

async function main() {
    console.log('Testing Incremental SQL...');

    const sqlSelect = `
      SELECT 
          u.id as userId, 
          MAX(u.name) as userName, 
          SUM(cd.total_points) as totalPoints
  `;
    const sqlFrom = `
      FROM completed_deeds cd
      JOIN users u ON cd.user_id = u.id
      LEFT JOIN districts dist ON u.district_id = dist.id
      LEFT JOIN divisions div ON u.division_id = div.id
  `;

    // Test 1: Simple Join Count
    try {
        const res1 = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c ${sqlFrom}`);
        console.log('Test 1 (Join Count):', res1);
    } catch (e) {
        console.error('Test 1 Failed:', e);
    }

    // Test 2: User IDs
    try {
        const res2 = await prisma.$queryRawUnsafe(`SELECT u.id ${sqlFrom} LIMIT 5`);
        console.log('Test 2 (User IDs from Join):', res2);
    } catch (e) {
        console.error('Test 2 Failed:', e);
    }

    // Test 3: Aggregation
    try {
        const query3 = `
        ${sqlSelect}
        ${sqlFrom}
        GROUP BY u.id
        ORDER BY totalPoints DESC
        LIMIT 5
     `;
        console.log('Query 3:', query3);
        const res3 = await prisma.$queryRawUnsafe(query3);
        console.log('Test 3 (Aggregation):', res3);
    } catch (e) {
        console.error('Test 3 Failed:', e);
    }

    await prisma.$disconnect();
}

main();
