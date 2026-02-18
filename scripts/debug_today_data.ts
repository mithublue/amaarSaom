
import { prisma } from '../src/lib/db/prisma';

async function main() {
    try {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

        console.log('--- DEBUG INFO ---');
        console.log('Server Local Time:', now.toString());
        console.log('Generated todayStr:', todayStr);

        console.log('\n--- FETCHING RECENT DEEDS ---');
        // Fetch raw dates from DB - strictly existing columns
        const rawDates = await prisma.$queryRaw`
            SELECT id, date, total_points, completed_at 
            FROM completed_deeds 
            ORDER BY id DESC 
            LIMIT 10
        `;
        // Json stringify to see full object structure
        console.log('Recent 10 Deeds:', JSON.stringify(rawDates, null, 2));

        // Check for matches
        const countQuery = `
            SELECT COUNT(*) as count 
            FROM completed_deeds 
            WHERE date = '${todayStr}'
        `;
        console.log('\nRunning Count Query:', countQuery);

        const count = await prisma.$queryRawUnsafe(countQuery);

        // Handle BigInt serialization
        const serializedCount = JSON.stringify(count, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        );

        console.log(`\nCount of deeds matching '${todayStr}':`, serializedCount);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
