require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function verify() {
    try {
        const countries = await prisma.country.count();
        const divisions = await prisma.division.count();
        const districts = await prisma.district.count();
        const deeds = await prisma.predefinedGoodDeed.count();

        console.log('✅ Seed Verification Results:');
        console.log(`   📍 Countries: ${countries}`);
        console.log(`   📍 Divisions: ${divisions}`);
        console.log(`   📍 Districts: ${districts}`);
        console.log(`   ✨ Predefined Good Deeds: ${deeds}`);

        if (countries >= 1 && divisions >= 8 && districts >= 5 && deeds >= 10) {
            console.log('\n🎉 SEED SUCCESSFUL! All data exists in database.');
        } else {
            console.log('\n⚠️  Seed may be incomplete. Please check the data.');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
