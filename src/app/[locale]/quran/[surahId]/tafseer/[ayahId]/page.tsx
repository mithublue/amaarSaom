import { getTafseer, getChapterDetails } from '@/lib/services/quranService';
import { Link } from '@/i18n/routing';
import { X, AlertCircle } from 'lucide-react';
import { SURAH_NAMES_BN } from '@/lib/data/surahNamesBn';
import TafseerShareButtons from './TafseerShareButtons';

interface PageProps {
    params: Promise<{ locale: string; surahId: string; ayahId: string }>;
}

export default async function TafseerPage({ params }: PageProps) {
    const { locale, surahId, ayahId } = await params;
    const tafseerId = locale === 'bn' ? 164 : 169; // 164: Ahsanul Bayaan, 169: Ibn Kathir
    const verseKey = `${surahId}:${ayahId}`;

    const [tafseerData, surahData] = await Promise.all([
        getTafseer(verseKey, tafseerId),
        getChapterDetails(parseInt(surahId, 10))
    ]);

    const tafseer = tafseerData?.tafsir;
    const surahName = locale === 'bn' && SURAH_NAMES_BN[Number(surahId)]
        ? SURAH_NAMES_BN[Number(surahId)]
        : surahData?.name_simple || 'Unknown Surah';

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-2xl h-full bg-primary-950 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden relative border-l border-white/10">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-primary-900/80 backdrop-blur-md border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {surahName}
                            <span className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Ayah {ayahId}
                            </span>
                        </h2>
                        <p className="text-xs text-primary-300">
                            {locale === 'bn' ? 'তাফসীর আহসানুল বয়ান' : 'Tafsir Ibn Kathir'}
                        </p>
                    </div>
                    <div className="flex items-center">
                        <TafseerShareButtons
                            surahId={surahId}
                            ayahId={ayahId}
                            surahName={surahName}
                            tafseerText={tafseer?.text || ''}
                        />
                        <Link
                            href={`/quran/${surahId}#ayah-${verseKey}`}
                            className="p-2 rounded-full hover:bg-white/10 text-primary-200 hover:text-white transition"
                        >
                            <X className="w-6 h-6" />
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {tafseer?.text ? (
                        <div
                            className="prose prose-invert prose-lg max-w-none text-primary-100 font-sans leading-relaxed tafseer-content"
                            dangerouslySetInnerHTML={{ __html: tafseer.text }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-primary-400 gap-4">
                            <AlertCircle className="w-12 h-12 opacity-50" />
                            <p>{locale === 'bn' ? 'এই আয়াতের তাফসীর পাওয়া যায়নি।' : 'Tafseer not available for this Ayah.'}</p>
                        </div>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes slide-in-right {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                    .animate-slide-in-right {
                        animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    .tafseer-content p { margin-bottom: 1.5em; }
                    .tafseer-content h1, .tafseer-content h2, .tafseer-content h3 { color: #10b981; margin-top: 2em; margin-bottom: 1em; }
                    .tafseer-content .arabic { font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 1.5em; text-align: right; color: #fff; margin: 1em 0; line-height: 2; direction: rtl; }
                `}} />
            </div>
        </div>
    );
}
