import hadithsData from '@/app/api/json/hadiths.json';

export interface Hadith {
    id: number;
    source: string;
    category: string;
    textEn: string;
    textBn: string;
    textAr: string;
}

export const getAllHadiths = (): Hadith[] => {
    return hadithsData as Hadith[];
};

export const getHadithById = (id: number): Hadith | undefined => {
    return (hadithsData as Hadith[]).find(h => h.id === id);
};

export const getCategories = (): string[] => {
    const categories = new Set((hadithsData as Hadith[]).map(h => h.category));
    return Array.from(categories);
};

export const getHadithByCategory = (category: string): Hadith[] => {
    return (hadithsData as Hadith[]).filter(h => h.category === category);
};
