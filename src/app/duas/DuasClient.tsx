'use client';

import { useState } from 'react';

type Dua = {
    title: string;
    arabic: string;
    transliteration?: string;
    translation: string;
    reference?: string;
};

type DuaCategory = {
    id: string;
    name: string;
    icon: string;
    duas: Dua[];
};

const duaCollections: DuaCategory[] = [
    {
        id: 'fasting',
        name: 'Ramadan & Fasting',
        icon: '🌙',
        duas: [
            {
                title: 'Dua for Iftar (Breaking Fast)',
                arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
                transliteration: 'Zhahabadh-dhama\'u wabtallatil-\'urooqu wa thabetal-ajru in shaa\'Allah.',
                translation: 'The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.',
                reference: 'Abu Dawud'
            },
            {
                title: 'Dua for Sehri (Intention)',
                arabic: 'وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ',
                transliteration: 'Wa bisawmi ghadin nawaitu min shahri ramadan.',
                translation: 'I intend to keep the fast for tomorrow in the month of Ramadan.',
            },
            {
                title: 'When breaking fast at someone\'s home',
                arabic: 'أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ وَأَكَلَ طَعَامَكُمُ الأَبْرَارُ وَصَلَّتْ عَلَيْكُمُ الْمَلاَئِكَةُ',
                translation: 'May the fasting people break fasting at your place, and may the pious eat from your food, and may the angels pray for you.',
                reference: 'Ibn Majah'
            }
        ]
    },
    {
        id: 'laylatul-qadr',
        name: 'Laylatul Qadr',
        icon: '✨',
        duas: [
            {
                title: 'Dua for Laylatul Qadr',
                arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
                transliteration: 'Allahumma innaka \'afuwwun tuhibbul-\'afwa fa\'fu \'anni.',
                translation: 'O Allah, You are Forgiving and love forgiveness, so forgive me.',
                reference: 'Tirmidhi'
            }
        ]
    },
    {
        id: 'daily',
        name: 'Daily Life',
        icon: '🏠',
        duas: [
            {
                title: 'Before Sleeping',
                arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
                translation: 'In Your Name, O Allah, I die and I live.',
                reference: 'Bukhari'
            },
            {
                title: 'Upon Waking Up',
                arabic: 'الْحَمْدُ للهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
                translation: 'All praise is due to Allah who gave us life after He had caused us to die and unto Him is the resurrection.',
                reference: 'Bukhari'
            },
            {
                title: 'Before Eating',
                arabic: 'بِسْمِ اللَّهِ',
                translation: 'In the name of Allah.',
            },
            {
                title: 'After Eating',
                arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
                translation: 'All praise is due to Allah who fed us and gave us drink and made us Muslims.',
            },
            {
                title: 'Leaving the House',
                arabic: 'بِسْمِ اللهِ ، تَوَكَّلْتُ عَلَى اللهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
                translation: 'In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.',
                reference: 'Tirmidhi'
            }
        ]
    },
    {
        id: 'prayer',
        name: 'Prayer (Salah)',
        icon: '🕌',
        duas: [
            {
                title: 'Dua Qunut (Witr)',
                arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ وَعَافِنِي فِيمَنْ عَافَيْتَ...',
                translation: 'O Allah, guide me among those Thou hast guided, grant me security among those Thou hast granted security...',
                reference: 'Abu Dawud'
            },
            {
                title: 'After Prayer',
                arabic: 'اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ تَبَارَكْتَ يَا ذَا الْجَلاَلِ وَالإِكْرَامِ',
                translation: 'O Allah, You are Peace and from You is peace. Blessed are You, O Owner of Majesty and Honor.',
                reference: 'Muslim'
            }
        ]
    },
    {
        id: 'forgiveness',
        name: 'Forgiveness',
        icon: '🤲',
        duas: [
            {
                title: 'Sayyidul Istighfar',
                arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ',
                translation: 'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I consider it my duty to keep my word and promise to You as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your gratitude for the favors You have bestowed upon me, and I acknowledge my sins, so forgive me, for no one forgives sins but You.',
                reference: 'Bukhari'
            },
            {
                title: 'Rabbana Atina',
                arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
                translation: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
                reference: 'Quran 2:201'
            }
        ]
    }
];

export default function DuasClient() {
    const [selectedCategory, setSelectedCategory] = useState<string>('fasting');
    const [expandedDua, setExpandedDua] = useState<number | null>(null);

    const activeCollection = duaCollections.find(c => c.id === selectedCategory) || duaCollections[0];

    const toggleExpand = (index: number) => {
        setExpandedDua(expandedDua === index ? null : index);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Spiritual Armour 🛡️
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 overflow-x-auto md:overflow-visible flex md:flex-col gap-2 border border-white/10 scrollbar-hide">
                        {duaCollections.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => { setSelectedCategory(cat.id); setExpandedDua(null); }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal text-left ${selectedCategory === cat.id
                                        ? 'bg-accent text-white shadow-lg'
                                        : 'text-primary-200 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className="text-2xl">{cat.icon}</span>
                                <span className="font-semibold">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 md:p-8 min-h-[500px]">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                            <span className="text-4xl">{activeCollection.icon}</span>
                            <h3 className="text-2xl font-bold text-white">{activeCollection.name}</h3>
                        </div>

                        <div className="grid gap-6">
                            {activeCollection.duas.map((dua, index) => (
                                <div
                                    key={index}
                                    onClick={() => toggleExpand(index)}
                                    className={`bg-black/20 rounded-2xl p-6 transition-all border border-white/5 cursor-pointer ${expandedDua === index ? 'bg-black/40 scale-[1.01] shadow-xl' : 'hover:bg-black/30'
                                        }`}
                                >
                                    <h4 className="text-accent font-bold text-lg mb-4 flex items-start justify-between">
                                        <span>{dua.title}</span>
                                        <div className="flex items-center gap-2">
                                            {dua.reference && (
                                                <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">
                                                    {dua.reference}
                                                </span>
                                            )}
                                            <span className="text-white/40 text-xs">{expandedDua === index ? 'Collapse' : 'Expand'}</span>
                                        </div>
                                    </h4>

                                    <p className={`text-white text-2xl md:text-3xl font-serif leading-loose text-right mb-4 ${expandedDua === index ? '' : 'line-clamp-3'}`} dir="rtl">
                                        {dua.arabic}
                                    </p>

                                    {dua.transliteration && (
                                        <p className="text-primary-200 text-sm mb-2 italic">
                                            "{dua.transliteration}"
                                        </p>
                                    )}

                                    <p className={`text-white/90 ${expandedDua === index ? '' : 'line-clamp-2'}`}>
                                        {dua.translation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
