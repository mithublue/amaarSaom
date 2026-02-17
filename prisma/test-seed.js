require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function test() {
    try {
        console.log('🔄 Attempting to connect to database...');

        // Simple test query
        const count = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Database connection successful!', count);

        // Try to count countries
        const countryCount = await prisma.country.count();
        console.log(`📊 Current countries in DB: ${countryCount}`);

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
