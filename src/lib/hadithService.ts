import allHadiths from '@/app/api/json/hadiths.json';

export interface Hadith {
    id: number;
    source: string;
    category: string;
    textEn: string;
    textBn: string;
    textAr: string;
}

export function getHadithOfTheDay(date: Date = new Date()): Hadith {
    // Deterministic 'Random' Hadith based on Date (Day of Year)
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const index = dayOfYear % allHadiths.length;
    return allHadiths[index] as Hadith;
}

export function getHadithById(id: number): Hadith | undefined {
    return allHadiths.find(h => h.id === id) as Hadith | undefined;
}
