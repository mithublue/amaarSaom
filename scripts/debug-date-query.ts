import { PrismaClient } from '@prisma/client';
import { startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    try {
        const now = new Date();
        const startDate = startOfDay(now);

        console.log('--- Debugging Timestamps ---');
        console.log(`Now: ${now.toISOString()}`);
        console.log(`Calculated Start of Day (Local): ${startDate.toString()}`);
        console.log(`Calculated Start of Day (ISO):   ${startDate.toISOString()}`);
        console.log(`Calculated Start of Day (ms):    ${startDate.getTime()}`);

        // Fetch the latest deed to compare
        const deeds = await prisma.completedDeed.findMany({
            orderBy: { date: 'desc' },
            take: 1
        });

        if (deeds.length > 0) {
            const deed = deeds[0];
            console.log('\n--- DB Deed Record ---');
            console.log(`Deed ID: ${deed.id}`);
            console.log(`DB Date (ISO): ${deed.date.toISOString()}`);
            console.log(`DB Date (ms):  ${deed.date.getTime()}`);

            console.log('\n--- Comparison ---');
            console.log(`DB Date >= Start Date? ${deed.date.getTime() >= startDate.getTime()}`);
            console.log(`Difference (ms): ${deed.date.getTime() - startDate.getTime()}`);
        } else {
            console.log('No deeds found in DB.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
