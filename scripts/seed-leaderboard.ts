import { PrismaClient } from '@prisma/client';
import { startOfDay, subDays } from 'date-fns';

const prisma = new PrismaClient();

const FAKE_USERS = [
    { name: 'Abdullah Al Mamun', image: null },
    { name: 'Fatima Begum', image: null },
    { name: 'Rahim Uddin', image: null },
    { name: 'Ayesha Siddiqua', image: null },
    { name: 'Omar Faruk', image: null },
    { name: 'Sadia Islam', image: null },
    { name: 'Kamal Hossain', image: null },
    { name: 'Nusrat Jahan', image: null },
    { name: 'Bilal Ahmed', image: null },
    { name: 'Tasnima Akter', image: null },
    { name: 'Yusuf Ali', image: null },
    { name: 'Zainab Rahman', image: null },
    { name: 'Hassan Mahmud', image: null },
    { name: 'Mariam Khan', image: null },
    { name: 'Ibrahim Khalil', image: null },
    { name: 'Safia Chowdhury', image: null },
    { name: 'Mustafizur Rahman', image: null },
    { name: 'Rubina Yasmin', image: null },
    { name: 'Tareq Jamil', image: null },
    { name: 'Sumaiya Shimu', image: null },
];

async function main() {
    console.log('🌱 Starting leaderboard seeding...');

    // 1. Fetch prerequisite data
    const predefinedDeeds = await prisma.predefinedGoodDeed.findMany();
    if (predefinedDeeds.length === 0) {
        console.error('❌ No predefined deeds found. Run `npm run prisma:seed` first.');
        return;
    }

    const districts = await prisma.district.findMany();
    const divisions = await prisma.division.findMany();
    const country = await prisma.country.findFirst({ where: { code: 'BD' } });

    if (!country) {
        console.error('❌ Country BD not found.');
        return;
    }

    console.log(`📊 Found ${predefinedDeeds.length} deeds, ${districts.length} districts, ${divisions.length} divisions.`);

    // 2. Create Users
    console.log('👥 Creating users...');
    const createdUsers = [];

    for (const fakeUser of FAKE_USERS) {
        // Randomly assign location
        const division = divisions[Math.floor(Math.random() * divisions.length)];
        // 50% chance to have a specific district if division has them (currently fetched all, but logic simplified)
        // Let's just assign random district or division
        const district = Math.random() > 0.3 ? districts[Math.floor(Math.random() * districts.length)] : null;

        // If district assigned, ensure division matches (simplified: just use district's division if possible, or random)
        // To be safe and simple, we'll just assign valid IDs. Ideally strictly consistent, but for leaderboard test generic is fine.

        const email = `testuser_${fakeUser.name.toLowerCase().replace(/\s+/g, '.')}_${Math.floor(Math.random() * 1000)}@example.com`;

        try {
            // Check if user exists first to avoid duplicate email error
            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        name: fakeUser.name,
                        email: email,
                        image: fakeUser.image,
                        countryId: country.id,
                        divisionId: division.id,
                        districtId: district ? district.id : undefined,
                    },
                });
            }
            createdUsers.push(user);
        } catch (e) {
            console.log(`Skipping user ${fakeUser.name} (error: ${e})`);
        }
    }

    console.log(`✅ Created ${createdUsers.length} users.`);

    // 3. Create Completed Deeds
    console.log('📝 Generating deed history...');
    let deedsCount = 0;

    for (const user of createdUsers) {
        // Generate random number of deeds for each user (5 to 30)
        const numDeeds = Math.floor(Math.random() * 25) + 5;

        for (let i = 0; i < numDeeds; i++) {
            const deedRaw = predefinedDeeds[Math.floor(Math.random() * predefinedDeeds.length)];

            // Random date within last 30 days
            const rand = Math.random();
            let date = new Date();

            if (rand < 0.2) {
                // Today (keep as now)
            } else if (rand < 0.5) {
                // Past 7 days
                date = subDays(new Date(), Math.floor(Math.random() * 6) + 1);
            } else {
                // Past 30 days
                date = subDays(new Date(), Math.floor(Math.random() * 23) + 7);
            }

            try {
                await prisma.completedDeed.create({
                    data: {
                        userId: user.id,
                        goodDeedId: deedRaw.id,
                        basePoints: deedRaw.points,
                        bonusPoints: 0,
                        multiplier: 1,
                        totalPoints: deedRaw.points,
                        date: startOfDay(date),
                        completedAt: date,
                    },
                });
                deedsCount++;
            } catch (error) {
                console.error(`Failed to create deed for user ${user.id}:`, error);
            }
        }
    }

    console.log(`✅ Generated ${deedsCount} completed deeds.`);
    console.log('Leaderboard seeding finished!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
