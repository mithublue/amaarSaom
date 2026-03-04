const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const nowLocal = new Date();
    const year = nowLocal.getFullYear();
    const month = String(nowLocal.getMonth() + 1).padStart(2, '0');
    const day = String(nowLocal.getDate()).padStart(2, '0');
    const todayUTC = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    console.log('Deleting attempts for date:', todayUTC);

    const res = await prisma.quizAttempt.deleteMany({
        where: {
            date: todayUTC
        }
    });

    console.log('Deleted attempts:', res.count);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
