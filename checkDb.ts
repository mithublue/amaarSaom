import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const attempts = await prisma.quizAttempt.findMany({
        where: { userId: 1 },
        select: { id: true, userId: true, date: true, createdAt: true, completedAt: true },
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(attempts, null, 2));
}

main().finally(() => prisma.$disconnect());
