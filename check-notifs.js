
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifs() {
    const notifs = await prisma.customNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
    });
    console.log('Recent Custom Notifications:', JSON.stringify(notifs, null, 2));
}

checkNotifs()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
