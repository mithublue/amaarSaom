import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const deeds = await prisma.completedDeed.findMany({
            orderBy: { completedAt: 'desc' },
            take: 5,
        });

        console.log('Recent Completed Deeds:');
        deeds.forEach(deed => {
            console.log({
                id: deed.id,
                completedAt: deed.completedAt.toISOString(), // UTC
                completedAtLocal: deed.completedAt.toLocaleString(), // Server Local
                date: deed.date.toISOString(), // UTC start of day
                dateLocal: deed.date.toLocaleString(), // Server Local start of day
            });
        });

        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        console.log('\nServer Time Analysis:');
        console.log('Now (ISO):', new Date().toISOString());
        console.log('Now (Local):', new Date().toLocaleString());
        console.log('Start of Today (Calculated in script):', startOfToday.toISOString());

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
