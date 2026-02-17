import { getCached, setCache } from '../db/redis';

// Types for Quran API responses
export interface Chapter {
    id: number;
    revelation_place: string;
    revelation_order: number;
    bismillah_pre: boolean;
    name_simple: string;
    name_complex: string;
    name_arabic: string;
    verses_count: number;
    pages: number[];
    translated_name: {
        language_name: string;
        name: string;
    };
}

export interface Verse {
    id: number;
    verse_key: string;
    text_uthmani: string;
    translations?: {
        id: number;
        resource_id: number;
        text: string;
    }[];
    audio?: {
        url: string;
    };
}

const API_BASE_URL = 'https://api.quran.com/api/v4';
const CACHE_TTL_SURAHS = 86400 * 30; // 30 days cache for list
const CACHE_TTL_VERSES = 86400; // 1 day for verses

/**
 * Fetch all chapters (surahs)
 */
export async function getAllChapters(): Promise<Chapter[]> {
    const cacheKey = 'quran:chapters';

    // Check cache
    const cached = await getCached<Chapter[]>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${API_BASE_URL}/chapters?language=en`, {
            cache: 'force-cache' // Static data, cache permanently
        });

        if (!response.ok) throw new Error('Failed to fetch chapters');

        const data = await response.json();
        const chapters = data.chapters as Chapter[];

        // Cache result
        await setCache(cacheKey, chapters, CACHE_TTL_SURAHS);

        return chapters;
    } catch (error) {
        console.error('Error fetching chapters:', error);
        return [];
    }
}

/**
 * Fetch verses for a specific chapter
 */
export async function getChapterVerses(id: number, offset = 0, limit = 10): Promise<Verse[]> {
    // English (131 - The Clear Quran) and Bengali (161 - Taisirul Quran)
    const translations = '131,161';
    const cacheKey = `quran:verses:${id}:${offset}:${limit}`;

    // Check cache first
    const cached = await getCached<Verse[]>(cacheKey);
    if (cached) return cached;

    try {
        // Correct pagination logic: page starts at 1
        const page = Math.floor(offset / limit) + 1;

        // Construct URL
        const url = `${API_BASE_URL}/verses/by_chapter/${id}?language=en&words=false&translations=${translations}&page=${page}&per_page=${limit}&fields=text_uthmani`;

        console.log(`[QuranService] Fetching verses for Surah ${id}: ${url}`);

        const response = await fetch(url, {
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[QuranService] API Error (${response.status}): ${errorText}`);
            throw new Error(`Failed to fetch verses: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.verses) {
            console.error('[QuranService] Invalid API response format:', data);
            return [];
        }

        const verses = data.verses as Verse[];

        // Cache result
        await setCache(cacheKey, verses, CACHE_TTL_VERSES);

        return verses;
    } catch (error) {
        console.error(`Error fetching verses for chapter ${id}:`, error);
        // Return empty array instead of throwing to prevent page crash
        return [];
    }
}

/**
 * Get details for a single chapter
 */
export async function getChapterDetails(id: number): Promise<Chapter | null> {
    const chapters = await getAllChapters();
    return chapters.find(c => c.id === id) || null;
}
