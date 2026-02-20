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

/**
 * Geocode a city+country to lat/lng using Nominatim (OpenStreetMap).
 * Public API — works for ALL users, no auth required.
 */
export async function geocodeCity(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const cleanCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cleanCountry = country.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const geo = await fetch(
            `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cleanCity)}&country=${encodeURIComponent(cleanCountry)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const places = await geo.json();
        if (places?.length > 0) {
            return { lat: parseFloat(places[0].lat), lng: parseFloat(places[0].lon) };
        }
    } catch { }
    return null;
}

/**
 * Resolve the full Aladhan coordinate-based URL.
 * Priority: GPS localStorage coords → Nominatim geocode → fallback Dhaka
 * Always uses /timings/{ts}?lat&lng (never the broken timingsByCity).
 */
export async function resolveAladhanUrl(defaultLocale?: string): Promise<string> {
    const ts = Math.floor(Date.now() / 1000);
    const base = `https://api.aladhan.com/v1/timings/${ts}`;

    // 1. GPS from localStorage (highest priority)
    const gps = getGpsLocation();
    if (gps && gps.useCoords && gps.lat != null && gps.lng != null) {
        return `${base}?latitude=${gps.lat}&longitude=${gps.lng}&method=1`;
    }

    // 2. Profile city → geocode via Nominatim
    try {
        const res = await fetch('/api/user/profile');
        const text = await res.text();
        const data = JSON.parse(text);
        if (data.success && data.data?.cityName) {
            const coords = await geocodeCity(data.data.cityName, data.data.countryName || 'Bangladesh');
            if (coords) {
                return `${base}?latitude=${coords.lat}&longitude=${coords.lng}&method=1`;
            }
        }
    } catch { }

    // 3. Locale-based defaults
    const LOCALE_DEFAULTS: Record<string, { lat: number; lng: number }> = {
        bn: { lat: 23.8103, lng: 90.4125 }, // Dhaka
        en: { lat: 51.5074, lng: -0.1278 }, // London
        ar: { lat: 21.3891, lng: 39.8579 }, // Mecca
    };
    const def = (defaultLocale && LOCALE_DEFAULTS[defaultLocale]) || LOCALE_DEFAULTS['bn'];
    return `${base}?latitude=${def.lat}&longitude=${def.lng}&method=1`;
}


/** Build Aladhan API URL from a LocationData — never uses timingsByCity (broken) */
export function buildAladhanUrl(loc: LocationData): string {
    const ts = Math.floor(Date.now() / 1000);

    if (loc.useCoords && loc.lat != null && loc.lng != null) {
        return `https://api.aladhan.com/v1/timings/${ts}?latitude=${loc.lat}&longitude=${loc.lng}&method=1`;
    }

    // Lookup table for common cities (timingsByCity is broken on Aladhan)
    const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
        'Dhaka': { lat: 23.8103, lng: 90.4125 },
        'London': { lat: 51.5074, lng: -0.1278 },
        'Mecca': { lat: 21.3891, lng: 39.8579 },
        'Medina': { lat: 24.5247, lng: 39.5692 },
        'Riyadh': { lat: 24.7136, lng: 46.6753 },
        'Dubai': { lat: 25.2048, lng: 55.2708 },
        'Istanbul': { lat: 41.0082, lng: 28.9784 },
        'Cairo': { lat: 30.0444, lng: 31.2357 },
        'Jakarta': { lat: -6.2088, lng: 106.8456 },
        'Karachi': { lat: 24.8607, lng: 67.0011 },
        'Lahore': { lat: 31.5204, lng: 74.3587 },
    };

    const cityKey = Object.keys(CITY_COORDS).find(
        k => k.toLowerCase() === loc.city.toLowerCase()
    );

    const coords = cityKey ? CITY_COORDS[cityKey] : { lat: 23.8103, lng: 90.4125 }; // Dhaka fallback
    return `https://api.aladhan.com/v1/timings/${ts}?latitude=${coords.lat}&longitude=${coords.lng}&method=1`;
}

