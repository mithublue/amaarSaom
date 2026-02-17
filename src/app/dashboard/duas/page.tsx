import Link from 'next/link';
import { auth } from '@/lib/auth/config';

export default async function DuasPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="text-white hover:text-accent transition"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Duas & Amal 🤲</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">
                        Essential Ramadan Duas
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {duas.map((dua, index) => (
                            <div
                                key={index}
                                className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 hover:bg-white/15 transition cursor-pointer"
                            >
                                <div className="text-4xl mb-3">{dua.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{dua.title}</h3>
                                <p className="text-primary-200 mb-3">{dua.occasion}</p>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-white text-lg mb-2 text-right" dir="rtl">
                                        {dua.arabic}
                                    </p>
                                    <p className="text-primary-100 text-sm italic">{dua.translation}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6">
                        <p className="text-center text-primary-100">
                            More duas and spiritual practices coming soon! Including audio recitations and categorized collections.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

const duas = [
    {
        icon: '🌙',
        title: 'Dua for Iftar',
        occasion: 'When breaking fast',
        arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
        translation: 'The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.',
    },
    {
        icon: '☀️',
        title: 'Dua for Sehri',
        occasion: 'Intention for fasting',
        arabic: 'وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ',
        translation: 'I intend to keep the fast for tomorrow in the month of Ramadan.',
    },
    {
        icon: '📿',
        title: 'Laylatul Qadr',
        occasion: 'The Night of Power',
        arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
        translation: 'O Allah, You are Forgiving and love forgiveness, so forgive me.',
    },
    {
        icon: '🤲',
        title: 'General Dua',
        occasion: 'Any time',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
        translation: 'Our Lord, give us good in this world and good in the Hereafter.',
    },
];
