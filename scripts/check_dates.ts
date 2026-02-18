
import { prisma } from '../src/lib/db/prisma';

async function main() {
    try {
        const deeds = await prisma.completedDeed.findMany({
            take: 5,
            orderBy: { id: 'desc' },
            select: { id: true, date: true, totalPoints: true }
        });

        console.log('--- Last 5 Deeds ---');
        deeds.forEach(d => {
            console.log(`ID: ${d.id}, Date: ${d.date.toISOString().split('T')[0]}, Points: ${d.totalPoints}`);
        });

        const count = await prisma.completedDeed.count({
            where: {
                date: new Date('2026-02-18')
            }
        });
        console.log(`\nCount for 2026-02-18: ${count}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
