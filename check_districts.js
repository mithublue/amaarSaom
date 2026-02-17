const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const divisions = await prisma.division.findMany();
    console.log('Divisions:', divisions);

    const chittagong = divisions.find(d => d.nameEn === 'Chittagong' || d.nameEn === 'Chattogram');

    if (chittagong) {
        console.log(`Found Chittagong Division ID: ${chittagong.id}`);
        const districts = await prisma.district.findMany({
            where: { divisionId: chittagong.id }
        });
        console.log(`Districts in Chittagong: ${districts.length}`);
        console.log(districts);
    } else {
        console.log('Chittagong Division not found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
