
import { prisma } from '@/lib/db/prisma';

async function main() {
    console.log('Testing Raw SQL...');
    try {
        const result = await prisma.$queryRawUnsafe('SELECT * FROM completed_deeds LIMIT 1');
        console.log('Result:', result);

        const count = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM completed_deeds');
        console.log('Count:', count);

        const userCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM users');
        console.log('User Count:', userCount);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
