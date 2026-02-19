require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    console.log('🌱 Starting database seeding...');

    // Seed Countries (Bangladesh-focused but extensible)
    console.log('📍 Seeding countries...');
    const bangladesh = await prisma.country.upsert({
        where: { code: 'BD' },
        update: {},
        create: {
            nameEn: 'Bangladesh',
            nameBn: 'বাংলাদেশ',
            nameAr: 'بنغلاديش',
            code: 'BD',
        },
    });

    // Seed Divisions
    console.log('📍 Seeding divisions...');
    const divisions = [
        { nameEn: 'Dhaka', nameBn: 'ঢাকা', nameAr: 'دكا' },
        { nameEn: 'Chittagong', nameBn: 'চট্টগ্রাম', nameAr: 'شيتاغونغ' },
        { nameEn: 'Rajshahi', nameBn: 'রाজশাহী', nameAr: 'راجشاهي' },
        { nameEn: 'Khulna', nameBn: 'খুলনা', nameAr: 'خولنا' },
        { nameEn: 'Barishal', nameBn: 'বরিশাল', nameAr: 'باريسال' },
        { nameEn: 'Sylhet', nameBn: 'সিলেট', nameAr: 'سيلهيت' },
        { nameEn: 'Rangpur', nameBn: 'রংপুর', nameAr: 'رانغبور' },
        { nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', nameAr: 'ميمنسينغ' },
    ];

    for (const div of divisions) {
        await prisma.division.upsert({
            where: { id: divisions.indexOf(div) + 1 },
            update: {},
            create: {
                ...div,
                countryId: bangladesh.id,
            },
        });
    }

    // Seed Sample Districts (Dhaka division)
    console.log('📍 Seeding sample districts...');
    const dhakaDivision = await prisma.division.findFirst({
        where: { nameEn: 'Dhaka' },
    });

    if (dhakaDivision) {
        const districts = [
            { nameEn: 'Dhaka', nameBn: 'ঢাকা', lat: 23.8103, lng: 90.4125 },
            { nameEn: 'Gazipur', nameBn: 'গাজীপুর', lat: 24.0022, lng: 90.4264 },
            { nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', lat: 23.6238, lng: 90.4997 },
            { nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', lat: 24.2513, lng: 89.9167 },
            { nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', lat: 23.8617, lng: 90.0003 },
        ];

        for (const dist of districts) {
            await prisma.district.create({
                data: {
                    nameEn: dist.nameEn,
                    nameBn: dist.nameBn,
                    latitude: dist.lat,
                    longitude: dist.lng,
                    divisionId: dhakaDivision.id,
                },
            });
        }
    }

    // Seed Predefined Good Deeds

    // Seed Predefined Good Deeds from JSON
    console.log('✨ Seeding predefined good deeds from JSON...');

    const amalsPath = require('path').join(__dirname, '../src/app/api/json/amals.json');
    const amalsData = require(amalsPath);

    for (const deed of amalsData) {
        // Map JSON fields to Prisma schema fields
        // JSON has: nameEn, nameBn, nameAr, categoryEn, categoryBn, categoryAr, etc.
        // Schema has: nameEn, nameBn, nameAr, category, categoryEn, categoryBn, categoryAr, etc.

        await prisma.predefinedGoodDeed.upsert({
            where: { id: deed.id },
            update: {
                nameEn: deed.nameEn,
                nameBn: deed.nameBn,
                nameAr: deed.nameAr,
                category: deed.categoryEn?.toLowerCase() || 'other', // Internal key
                categoryEn: deed.categoryEn,
                categoryBn: deed.categoryBn,
                categoryAr: deed.categoryAr,
                tier: deed.tier,
                points: deed.points,
                timeEstimateMinutes: deed.timeEstimateMinutes,
                icon: deed.icon,
                descriptionEn: deed.descriptionEn,
                // Add descriptions if available in JSON, otherwise null
                descriptionBn: deed.descriptionBn || null,
                descriptionAr: deed.descriptionAr || null,
            },
            create: {
                id: deed.id, // Ensure ID is preserved
                nameEn: deed.nameEn,
                nameBn: deed.nameBn,
                nameAr: deed.nameAr,
                category: deed.categoryEn?.toLowerCase() || 'other',
                categoryEn: deed.categoryEn,
                categoryBn: deed.categoryBn,
                categoryAr: deed.categoryAr,
                tier: deed.tier,
                points: deed.points,
                timeEstimateMinutes: deed.timeEstimateMinutes,
                icon: deed.icon,
                descriptionEn: deed.descriptionEn,
                descriptionBn: deed.descriptionBn || null,
                descriptionAr: deed.descriptionAr || null,
            },
        });
    }

    console.log(`   - ${amalsData.length} Predefined Good Deeds (from JSON)`);

    console.log('✅ Database seeding completed!');
    console.log(`📊 Created:`);
    console.log(`   - 1 Country (Bangladesh)`);
    console.log(`   - 8 Divisions`);
    console.log(`   - 5 Sample Districts (Dhaka division)`);
    console.log(`   - ${amalsData.length} Predefined Good Deeds`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
