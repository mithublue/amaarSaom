/**
 * Prayer Times Service
 * Fetches prayer times from Aladhan API with Redis caching
 */

import axios from 'axios';
import { getCached, setCache } from '../db/redis';
import { format } from 'date-fns';

const ALADHAN_API_URL = process.env.ALADHAN_API_URL || 'https://api.aladhan.com/v1';
const CACHE_TTL = 86400; // 24 hours in seconds

export interface PrayerTimes {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    sunrise: string;
    sunset: string;
    imsak: string; // Sahri time
    midnight: string;
}

export interface PrayerTimesResponse {
    date: string;
    hijriDate: string;
    hijriMonth: string;
    hijriYear: number;
    gregorianDate: string;
    timings: PrayerTimes;
    nextPrayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    timeUntilNext: number; // milliseconds
}

/**
 * Get prayer times for a specific location and date
 */
export async function getPrayerTimes(
    latitude: number,
    longitude: number,
    date: Date = new Date(),
    method: string = 'Karachi'
): Promise<PrayerTimesResponse | null> {
    const dateStr = format(date, 'dd-MM-yyyy');
    const cacheKey = `prayer:${latitude}:${longitude}:${dateStr}:${method}`;

    // Try to get from cache first
    const cached = await getCached<PrayerTimesResponse>(cacheKey);
    if (cached) {
        console.log('✅ Prayer times retrieved from cache');
        return cached;
    }

    try {
        // Fetch from Aladhan API
        const methodMap: { [key: string]: number } = {
            'MWL': 3,
            'ISNA': 2,
            'Egypt': 5,
            'Makkah': 4,
            'Karachi': 1,
            'Tehran': 7,
            'Jafari': 0,
        };

        const methodNumber = methodMap[method] || 1; // Default to Karachi

        const response = await axios.get(`${ALADHAN_API_URL}/timings/${dateStr}`, {
            params: {
                latitude,
                longitude,
                method: methodNumber,
            },
        });

        if (response.data.code !== 200 || !response.data.data) {
            console.error('Invalid API response:', response.data);
            return null;
        }

        const apiData = response.data.data;
        const timings = apiData.timings;

        const prayerTimes: PrayerTimes = {
            fajr: timings.Fajr,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha,
            sunrise: timings.Sunrise,
            sunset: timings.Sunset,
            imsak: timings.Imsak, // Sahri time
            midnight: timings.Midnight,
        };

        // Calculate next prayer
        const nextPrayerInfo = getNextPrayer(prayerTimes);

        const result: PrayerTimesResponse = {
            date: dateStr,
            hijriDate: apiData.date.hijri.date,
            hijriMonth: apiData.date.hijri.month.en,
            hijriYear: parseInt(apiData.date.hijri.year),
            gregorianDate: apiData.date.gregorian.date,
            timings: prayerTimes,
            nextPrayer: nextPrayerInfo.name,
            timeUntilNext: nextPrayerInfo.timeUntil,
        };

        // Cache the result
        await setCache(cacheKey, result, CACHE_TTL);
        console.log('✅ Prayer times fetched from API and cached');

        return result;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        return null;
    }
}

/**
 * Determine the next prayer and time until it
 */
function getNextPrayer(timings: PrayerTimes): { name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; timeUntil: number } {
    const now = new Date();
    const prayers: Array<{ name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; time: string }> = [
        { name: 'fajr', time: timings.fajr },
        { name: 'dhuhr', time: timings.dhuhr },
        { name: 'asr', time: timings.asr },
        { name: 'maghrib', time: timings.maghrib },
        { name: 'isha', time: timings.isha },
    ];

    for (const prayer of prayers) {
        const prayerTime = parseTime(prayer.time);
        if (prayerTime > now) {
            return {
                name: prayer.name,
                timeUntil: prayerTime.getTime() - now.getTime(),
            };
        }
    }

    // If no prayer is left today, next is Fajr tomorrow
    const fajrTomorrow = parseTime(timings.fajr);
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);

    return {
        name: 'fajr',
        timeUntil: fajrTomorrow.getTime() - now.getTime(),
    };
}

/**
 * Parse time string (HH:mm) to Date object today
 */
function parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * Get time until Iftar (Maghrib) in milliseconds
 */
export async function getTimeUntilIftar(
    latitude: number,
    longitude: number,
    method: string = 'Karachi'
): Promise<number | null> {
    const prayerTimes = await getPrayerTimes(latitude, longitude, new Date(), method);
    if (!prayerTimes) return null;

    const maghribTime = parseTime(prayerTimes.timings.maghrib);
    const now = new Date();

    if (maghribTime > now) {
        return maghribTime.getTime() - now.getTime();
    }

    // Iftar has passed for today
    return 0;
}

/**
 * Get time until Sahri (Imsak) in milliseconds
 */
export async function getTimeUntilSahri(
    latitude: number,
    longitude: number,
    method: string = 'Karachi'
): Promise<number | null> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const prayerTimes = await getPrayerTimes(latitude, longitude, tomorrow, method);
    if (!prayerTimes) return null;

    const imsakTime = parseTime(prayerTimes.timings.imsak);
    imsakTime.setDate(tomorrow.getDate());

    return imsakTime.getTime() - now.getTime();
}
