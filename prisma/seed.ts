import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

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
        { nameEn: 'Rajshahi', nameBn: 'রাজশাহী', nameAr: 'راجشاهي' },
        { nameEn: 'Khulna', nameBn: 'খুলনা', nameAr: 'خولنا' },
        { nameEn: 'Barishal', nameBn: 'বরিশাল', nameAr: 'باريسال' },
        { nameEn: 'Sylhet', nameBn: 'সিলেট', nameAr: 'سيلهيت' },
        { nameEn: 'Rangpur', nameBn: 'রংপুর', nameAr: 'رانغبور' },
        { nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', nameAr: 'ميمنسينغ' },
    ];

    for (const div of divisions) {
        await prisma.division.upsert({
            where: {
                id: divisions.indexOf(div) + 1
            },
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
    console.log('✨ Seeding predefined good deeds...');

    const goodDeeds = [
        // TIER 1: EASY (10-20 points)
        {
            nameEn: 'Smiling at someone',
            nameBn: 'কারো সাথে হাসিমুখে কথা বলা',
            nameAr: 'ابتسامة في وجه شخص ما',
            category: 'etiquette',
            tier: 'easy',
            points: 10,
            timeEstimateMinutes: 1,
            icon: '😊',
            descriptionEn: 'Your smile is charity',
        },
        {
            nameEn: 'Bedtime dua',
            nameBn: 'ঘুমানোর আগের দোয়া',
            nameAr: 'دعاء النوم',
            category: 'dhikr',
            tier: 'easy',
            points: 10,
            timeEstimateMinutes: 1,
            icon: '🤲',
            descriptionEn: 'Recite dua before sleeping',
        },
        {
            nameEn: 'Using miswak',
            nameBn: 'মিসওয়াক করা',
            nameAr: 'استخدام السواك',
            category: 'etiquette',
            tier: 'easy',
            points: 15,
            timeEstimateMinutes: 2,
            icon: '🪥',
            descriptionEn: 'Sunnah of the Prophet (SAW)',
        },
        {
            nameEn: 'Responding to adhan',
            nameBn: 'আজান শুনে উত্তর দেওয়া',
            nameAr: 'إجابة الأذان',
            category: 'dhikr',
            tier: 'easy',
            points: 20,
            timeEstimateMinutes: 1,
            icon: '🕌',
            descriptionEn: 'Repeat after the muezzin',
        },
        {
            nameEn: 'Saying Bismillah before eating',
            nameBn: 'খাওয়ার আগে বিসমিল্লাহ বলা',
            nameAr: 'قول بسم الله قبل الأكل',
            category: 'dhikr',
            tier: 'easy',
            points: 10,
            timeEstimateMinutes: 1,
            icon: '🍽️',
            descriptionEn: 'Begin meals with Allah\'s name',
        },
        {
            nameEn: 'Saying Alhamdulillah after eating',
            nameBn: 'খাওয়ার পরে আলহামদুলিল্লাহ বলা',
            nameAr: 'قول الحمد لله بعد الأكل',
            category: 'dhikr',
            tier: 'easy',
            points: 10,
            timeEstimateMinutes: 1,
            icon: '🙏',
            descriptionEn: 'Thank Allah after meals',
        },
        {
            nameEn: 'Greeting with Salam',
            nameBn: 'সালাম দেওয়া',
            nameAr: 'إلقاء السلام',
            category: 'etiquette',
            tier: 'easy',
            points: 10,
            timeEstimateMinutes: 1,
            icon: '👋',
            descriptionEn: 'Spread peace among people',
        },
        {
            nameEn: 'SubhanAllah 33 times',
            nameBn: 'সুবহানাল্লাহ ৩৩ বার',
            nameAr: 'سبحان الله ٣٣ مرة',
            category: 'dhikr',
            tier: 'easy',
            points: 15,
            timeEstimateMinutes: 2,
            icon: '📿',
            descriptionEn: 'After prayer tasbih',
        },
        {
            nameEn: 'Alhamdulillah 33 times',
            nameBn: 'আলহামদুলিল্লাহ ৩৩ বার',
            nameAr: 'الحمد لله ٣٣ مرة',
            category: 'dhikr',
            tier: 'easy',
            points: 15,
            timeEstimateMinutes: 2,
            icon: '📿',
            descriptionEn: 'After prayer tasbih',
        },
        {
            nameEn: 'Allahu Akbar 34 times',
            nameBn: 'আল্লাহু আকবার ৩৪ বার',
            nameAr: 'الله أكبر ٣٤ مرة',
            category: 'dhikr',
            tier: 'easy',
            points: 15,
            timeEstimateMinutes: 2,
            icon: '📿',
            descriptionEn: 'After prayer tasbih',
        },

        // TIER 2: MEDIUM (50-80 points)
        {
            nameEn: 'Fajr prayer',
            nameBn: 'ফজরের নামাজ',
            nameAr: 'صلاة الفجر',
            category: 'prayer',
            tier: 'medium',
            points: 50,
            timeEstimateMinutes: 10,
            icon: '🌅',
            descriptionEn: 'Dawn prayer',
        },
        {
            nameEn: 'Dhuhr prayer',
            nameBn: 'জোহরের নামাজ',
            nameAr: 'صلاة الظهر',
            category: 'prayer',
            tier: 'medium',
            points: 50,
            timeEstimateMinutes: 10,
            icon: '☀️',
            descriptionEn: 'Noon prayer',
        },
        {
            nameEn: 'Asr prayer',
            nameBn: 'আসরের নামাজ',
            nameAr: 'صلاة العصر',
            category: 'prayer',
            tier: 'medium',
            points: 50,
            timeEstimateMinutes: 10,
            icon: '🌤️',
            descriptionEn: 'Afternoon prayer',
        },
        {
            nameEn: 'Maghrib prayer',
            nameBn: 'মাগরিবের নামাজ',
            nameAr: 'صلاة المغرب',
            category: 'prayer',
            tier: 'medium',
            points: 50,
            timeEstimateMinutes: 10,
            icon: '🌆',
            descriptionEn: 'Sunset prayer',
        },
        {
            nameEn: 'Isha prayer',
            nameBn: 'এশার নামাজ',
            nameAr: 'صلاة العشاء',
            category: 'prayer',
            tier: 'medium',
            points: 50,
            timeEstimateMinutes: 10,
            icon: '🌙',
            descriptionEn: 'Night prayer',
        },
        {
            nameEn: 'Iftar dua',
            nameBn: 'ইফতারের আগে দোয়া',
            nameAr: 'دعاء الإفطار',
            category: 'fasting',
            tier: 'medium',
            points: 50,
            timeEstimateMinutes: 2,
            icon: '🤲',
            descriptionEn: 'Dua before breaking fast',
        },
        {
            nameEn: 'Taraweeh prayer',
            nameBn: 'তারাবিহ পড়া',
            nameAr: 'صلاة التراويح',
            category: 'prayer',
            tier: 'medium',
            points: 80,
            timeEstimateMinutes: 60,
            icon: '🕌',
            descriptionEn: 'Ramadan night prayer',
        },
        {
            nameEn: 'Reciting Quran (1-5 pages)',
            nameBn: 'কুরআন তিলাওয়াত (১-৫ পৃষ্ঠা)',
            nameAr: 'تلاوة القرآن (١-٥ صفحات)',
            category: 'quran',
            tier: 'medium',
            points: 60,
            timeEstimateMinutes: 15,
            icon: '📖',
            descriptionEn: 'Read Quran daily',
        },
        {
            nameEn: 'Making sincere dua',
            nameBn: 'আন্তরিক দোয়া করা',
            nameAr: 'الدعاء بإخلاص',
            category: 'dhikr',
            tier: 'medium',
            points: 50,
            timeEstimateMinutes: 5,
            icon: '🤲',
            descriptionEn: 'Heartfelt supplication',
        },
        {
            nameEn: 'Dhikr after prayer',
            nameBn: 'নামাজের পরে তাসবিহ',
            nameAr: 'الذكر بعد الصلاة',
            category: 'dhikr',
            tier: 'medium',
            points: 50,
            timeEstimateMinutes: 5,
            icon: '📿',
            descriptionEn: 'Post-prayer remembrance',
        },
        {
            nameEn: 'Reading Islamic book',
            nameBn: 'ইসলামী বই পড়া',
            nameAr: 'قراءة كتاب إسلامي',
            category: 'other',
            tier: 'medium',
            points: 60,
            timeEstimateMinutes: 20,
            icon: '📚',
            descriptionEn: 'Seeking knowledge',
        },

        // TIER 3: HARD (100-500 points)
        {
            nameEn: 'Reciting 1 Juz Quran',
            nameBn: 'এক পারা কুরআন তিলাওয়াত',
            nameAr: 'تلاوة جزء من القرآن',
            category: 'quran',
            tier: 'hard',
            points: 100,
            timeEstimateMinutes: 60,
            icon: '📖',
            descriptionEn: 'Complete one Juz',
        },
        {
            nameEn: 'Tahajjud prayer',
            nameBn: 'তাহাজ্জুদ পড়া',
            nameAr: 'صلاة التهجد',
            category: 'prayer',
            tier: 'hard',
            points: 150,
            timeEstimateMinutes: 30,
            icon: '🌙',
            descriptionEn: 'Night vigil prayer',
        },
        {
            nameEn: 'Providing Iftar to someone',
            nameBn: 'কাউকে ইফতার করানো',
            nameAr: 'إطعام الصائم',
            category: 'charity',
            tier: 'hard',
            points: 200,
            timeEstimateMinutes: 30,
            icon: '🍽️',
            descriptionEn: 'Feed a fasting person',
        },
        {
            nameEn: 'Charity/Sadaqah',
            nameBn: 'দান/সদকা করা',
            nameAr: 'الصدقة',
            category: 'charity',
            tier: 'hard',
            points: 200,
            timeEstimateMinutes: 10,
            icon: '💰',
            descriptionEn: 'Give charity',
        },
        {
            nameEn: 'Visiting sick person',
            nameBn: 'অসুস্থ ব্যক্তিকে দেখতে যাওয়া',
            nameAr: 'زيارة المريض',
            category: 'other',
            tier: 'hard',
            points: 100,
            timeEstimateMinutes: 60,
            icon: '🏥',
            descriptionEn: 'Visit the sick',
        },
        {
            nameEn: 'Teaching Quran/Islam',
            nameBn: 'কুরআন/ইসলাম শেখানো',
            nameAr: 'تعليم القرآن/الإسلام',
            category: 'other',
            tier: 'hard',
            points: 200,
            timeEstimateMinutes: 30,
            icon: '👨‍🏫',
            descriptionEn: 'Teach Islamic knowledge',
        },
        {
            nameEn: 'Helping parents with chores',
            nameBn: 'বাবা-মাকে সাহায্য করা',
            nameAr: 'مساعدة الوالدين',
            category: 'other',
            tier: 'hard',
            points: 120,
            timeEstimateMinutes: 30,
            icon: '❤️',
            descriptionEn: 'Be dutiful to parents',
        },
        {
            nameEn: 'Fasting (Nafl)',
            nameBn: 'নফল রোজা রাখা',
            nameAr: 'صيام النافلة',
            category: 'fasting',
            tier: 'hard',
            points: 250,
            timeEstimateMinutes: 720,
            icon: '🌟',
            descriptionEn: 'Voluntary fasting',
        },
        {
            nameEn: 'Complete Quran recitation',
            nameBn: 'সম্পূর্ণ কুরআন খতম',
            nameAr: 'ختم القرآن الكريم',
            category: 'quran',
            tier: 'hard',
            points: 500,
            timeEstimateMinutes: 1800,
            icon: '📖',
            descriptionEn: 'Finish entire Quran',
        },
        {
            nameEn: 'Night of Qadr worship',
            nameBn: 'লাইলাতুল কদরে ইবাদত',
            nameAr: 'قيام ليلة القدر',
            category: 'prayer',
            tier: 'hard',
            points: 300,
            timeEstimateMinutes: 240,
            icon: '✨',
            descriptionEn: 'Worship on the blessed night',
        },
    ];

    for (const deed of goodDeeds) {
        await prisma.predefinedGoodDeed.create({
            data: deed,
        });
    }

    console.log('✅ Database seeding completed!');
    console.log(`📊 Created:`);
    console.log(`   - 1 Country (Bangladesh)`);
    console.log(`   - 8 Divisions`);
    console.log(`   - 5 Sample Districts (Dhaka division)`);
    console.log(`   - ${goodDeeds.length} Predefined Good Deeds`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
