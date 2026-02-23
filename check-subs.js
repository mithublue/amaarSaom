
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
    const duplicates = await prisma.$queryRaw`
    SELECT user_id, COUNT(*) as count 
    FROM push_subscriptions 
    GROUP BY user_id 
    HAVING count > 1
  `;
    console.log('Duplicates:', JSON.stringify(duplicates, null, 2));

    if (duplicates.length > 0) {
        const userIds = duplicates.map(d => d.user_id);
        const subs = await prisma.pushSubscription.findMany({
            where: { userId: { in: userIds } },
            orderBy: { userId: 'asc' }
        });
        console.log('Subscriptions for duplicate users:', JSON.stringify(subs, null, 2));
    }
}

checkDuplicates()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
