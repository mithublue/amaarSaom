
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    const result = await prisma.pushSubscription.deleteMany({});
    console.log('Cleared subscriptions:', result.count);
}

cleanup()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
