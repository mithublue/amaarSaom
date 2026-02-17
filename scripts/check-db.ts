import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const deedsCount = await prisma.predefinedGoodDeed.count();
        console.log(`Predefined Good Deeds Count: ${deedsCount}`);

        if (deedsCount > 0) {
            const deeds = await prisma.predefinedGoodDeed.findMany({ take: 5 });
            console.log('Sample Deeds:', JSON.stringify(deeds, null, 2));
        }

        const usersCount = await prisma.user.count();
        console.log(`Users Count: ${usersCount}`);
    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
