/**
 * Shared location resolution utility.
 *
 * Priority:
 *  1. GPS / "Use My Location" result saved in localStorage  (key: 'nuzul_gps_location')
 *  2. Location saved in user profile  (from /api/user/profile)
 *  3. Default: Dhaka, Bangladesh
 */

export const GPS_LOCATION_KEY = 'nuzul_gps_location';

export interface LocationData {
    city: string;
    country: string;
    lat?: number;
    lng?: number;
    useCoords?: boolean;
}

/** Save GPS-detected location to localStorage */
export function saveGpsLocation(data: LocationData) {
    try {
        localStorage.setItem(GPS_LOCATION_KEY, JSON.stringify(data));
    } catch { }
}

/** Clear GPS location from localStorage (e.g. when user manually picks a city) */
export function clearGpsLocation() {
    try {
        localStorage.removeItem(GPS_LOCATION_KEY);
    } catch { }
}

/** Read GPS location from localStorage */
export function getGpsLocation(): LocationData | null {
    try {
        const raw = localStorage.getItem(GPS_LOCATION_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as LocationData;
    } catch {
        return null;
    }
}

/**
 * Resolve effective location using the priority chain:
 * GPS localStorage → profile API → default Dhaka
 */
export async function resolveLocation(): Promise<LocationData> {
    // 1. GPS from localStorage
    const gps = getGpsLocation();
    if (gps) return gps;

    // 2. Profile location
    try {
        const res = await fetch('/api/user/profile');
        const text = await res.text();
        const data = JSON.parse(text);
        if (data.success && data.data?.cityName) {
            return {
                city: data.data.cityName,
                country: data.data.countryName || 'Bangladesh',
                useCoords: false,
            };
        }
    } catch { }

    // 3. Default
    return { city: 'Dhaka', country: 'Bangladesh', useCoords: false };
}

/** Build Aladhan API URL from a LocationData */
export function buildAladhanUrl(loc: LocationData): string {
    if (loc.useCoords && loc.lat != null && loc.lng != null) {
        return `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${loc.lat}&longitude=${loc.lng}&method=1`;
    }
    const city = loc.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const country = loc.country.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1`;
}
