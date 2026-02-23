
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubs() {
    const subs = await prisma.pushSubscription.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
    });
    console.log('Recent Subscriptions:', JSON.stringify(subs, null, 2));
}

checkSubs()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
