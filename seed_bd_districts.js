const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const districtsData = [
    // Dhaka Division
    {
        division: 'Dhaka', districts: [
            { nameEn: 'Dhaka', nameBn: 'ঢাকা' },
            { nameEn: 'Faridpur', nameBn: 'ফরিদপুর' },
            { nameEn: 'Gazipur', nameBn: 'গাজীপুর' },
            { nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ' },
            { nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ' },
            { nameEn: 'Madaripur', nameBn: 'মাদারীপুর' },
            { nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ' },
            { nameEn: 'Munshiganj', nameBn: 'মুন্সিগঞ্জ' },
            { nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ' },
            { nameEn: 'Narsingdi', nameBn: 'নরসিংদী' },
            { nameEn: 'Rajbari', nameBn: 'রাজবাড়ী' },
            { nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর' },
            { nameEn: 'Tangail', nameBn: 'টাঙ্গাইল' }
        ]
    },
    // Chittagong Division
    {
        division: 'Chittagong', districts: [
            { nameEn: 'Bandarban', nameBn: 'বান্দরবান' },
            { nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া' },
            { nameEn: 'Chandpur', nameBn: 'চাঁদপুর' },
            { nameEn: 'Chittagong', nameBn: 'চট্টগ্রাম' },
            { nameEn: 'Comilla', nameBn: 'কুমিল্লা' },
            { nameEn: "Cox's Bazar", nameBn: 'কক্সবাজার' },
            { nameEn: 'Feni', nameBn: 'ফেনী' },
            { nameEn: 'Khagrachhari', nameBn: 'খাগড়াছড়ি' },
            { nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর' },
            { nameEn: 'Noakhali', nameBn: 'নোয়াখালী' },
            { nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি' }
        ]
    },
    // Rajshahi Division
    {
        division: 'Rajshahi', districts: [
            { nameEn: 'Bogra', nameBn: 'বগুড়া' },
            { nameEn: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ' },
            { nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট' },
            { nameEn: 'Naogaon', nameBn: 'নওগাঁ' },
            { nameEn: 'Natore', nameBn: 'নাটোর' },
            { nameEn: 'Pabna', nameBn: 'পাবনা' },
            { nameEn: 'Rajshahi', nameBn: 'রাজশাহী' },
            { nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ' }
        ]
    },
    // Khulna Division
    {
        division: 'Khulna', districts: [
            { nameEn: 'Bagerhat', nameBn: 'বাগেরহাট' },
            { nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা' },
            { nameEn: 'Jessore', nameBn: 'যশোর' },
            { nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ' },
            { nameEn: 'Khulna', nameBn: 'খুলনা' },
            { nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া' },
            { nameEn: 'Magura', nameBn: 'মাগুরা' },
            { nameEn: 'Meherpur', nameBn: 'মেহেরপুর' },
            { nameEn: 'Narail', nameBn: 'নড়াইল' },
            { nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা' }
        ]
    },
    // Barishal Division
    {
        division: 'Barishal', districts: [
            { nameEn: 'Barguna', nameBn: 'বরগুনা' },
            { nameEn: 'Barishal', nameBn: 'বরিশাল' },
            { nameEn: 'Bhola', nameBn: 'ভোলা' },
            { nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি' },
            { nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী' },
            { nameEn: 'Pirojpur', nameBn: 'পিরোজপুর' }
        ]
    },
    // Sylhet Division
    {
        division: 'Sylhet', districts: [
            { nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ' },
            { nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার' },
            { nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ' },
            { nameEn: 'Sylhet', nameBn: 'সিলেট' }
        ]
    },
    // Rangpur Division
    {
        division: 'Rangpur', districts: [
            { nameEn: 'Dinajpur', nameBn: 'দিনাজপুর' },
            { nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা' },
            { nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম' },
            { nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট' },
            { nameEn: 'Nilphamari', nameBn: 'নীলফামারী' },
            { nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়' },
            { nameEn: 'Rangpur', nameBn: 'রংপুর' },
            { nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও' }
        ]
    },
    // Mymensingh Division
    {
        division: 'Mymensingh', districts: [
            { nameEn: 'Jamalpur', nameBn: 'জামালপুর' },
            { nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ' },
            { nameEn: 'Netrokona', nameBn: 'নেত্রকোণা' },
            { nameEn: 'Sherpur', nameBn: 'শেরপুর' }
        ]
    }
];

async function main() {
    console.log('🌱 Starting to seed Bangladesh districts...');

    // Get all divisions first to map them
    const divisions = await prisma.division.findMany();
    console.log(`Found ${divisions.length} divisions.`);

    for (const group of districtsData) {
        const division = divisions.find(d => d.nameEn === group.division);

        if (!division) {
            console.warn(`⚠️ Division ${group.division} not found! Skipping...`);
            continue;
        }

        console.log(`📍 Processing ${group.division} division...`);

        for (const dist of group.districts) {
            // Find existing to update or create new
            const existing = await prisma.district.findFirst({
                where: {
                    nameEn: dist.nameEn,
                    divisionId: division.id
                }
            });

            if (!existing) {
                await prisma.district.create({
                    data: {
                        nameEn: dist.nameEn,
                        nameBn: dist.nameBn,
                        divisionId: division.id,
                        latitude: 0, // Placeholder, will update later if needed
                        longitude: 0 // Placeholder
                    }
                });
                // process.stdout.write('.');
            }
        }
        console.log(`   ✅ ${group.districts.length} districts processed.`);
    }

    console.log('\n✨ All districts seeded successfully!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
