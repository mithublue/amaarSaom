import { prisma } from '@/lib/db/prisma';

export const TOLA_TO_GRAM = 11.664;

export interface GoldPriceData {
    gold22kGram: number;
    gold24kGram: number;
    gold21kGram: number;
    gold18kGram: number;
    silverPerGram: number;
    currency: string;
    source: string;
    isManual: boolean;
}

// ── BD: Scrape from BAJUS ────────────────────────────────────────────────────
export async function scrapeBajusPrices(): Promise<GoldPriceData> {
    const bajusRes = await fetch('https://www.bajus.org/gold-price', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NuzulApp/1.0)',
            'Accept': 'text/html',
        },
        cache: 'no-store',
    });

    if (!bajusRes.ok) throw new Error(`BAJUS returned ${bajusRes.status}`);

    const html = await bajusRes.text();

    const extractPrice = (label: string): { price: number; isPerGram: boolean } | null => {
        // Look for the label, then find the FIRST number that follows it (optionally with BDT/GRAM units)
        // This avoids matching unrelated numbers in the footer or nearby text
        const re = new RegExp(label + '[^\\d]*?([\\d,]+(?:\\.\\d+)?)\\s*(BDT/GRAM|BDT/VORI|BDT)?', 'i');
        const m = html.match(re);
        if (!m) return null;

        const price = parseFloat(m[1].replace(/,/g, ''));
        const unit = m[2] ? m[2].toUpperCase() : '';
        const isPerGram = unit.includes('GRAM');

        return { price, isPerGram };
    };

    const g22 = extractPrice('22 KARAT Gold') ?? extractPrice('22');
    const g24 = extractPrice('24 KARAT Gold') ?? extractPrice('24');
    const g21 = extractPrice('21 KARAT Gold') ?? extractPrice('21');
    const g18 = extractPrice('18 KARAT Gold') ?? extractPrice('18');
    const silver = extractPrice('22 KARAT Silver') ?? extractPrice('silver') ?? extractPrice('রুপা');

    if (!g22) throw new Error('Could not parse BAJUS gold price (22K missing)');

    const toGram = (res: { price: number; isPerGram: boolean } | null, fallback?: number): number => {
        if (!res) return fallback ? parseFloat((fallback / TOLA_TO_GRAM).toFixed(2)) : 0;
        if (res.isPerGram) return res.price;
        return parseFloat((res.price / TOLA_TO_GRAM).toFixed(2));
    };

    // BAJUS prices are usually per ভরি (tola) but sometimes reported per gram
    return {
        gold22kGram: toGram(g22),
        gold24kGram: toGram(g24, g22.price * 1.095),
        gold21kGram: toGram(g21, g22.price * 0.955),
        gold18kGram: toGram(g18, g22.price * 0.818),
        silverPerGram: toGram(silver, g22.price * 0.017),
        currency: 'BDT',
        source: 'BAJUS',
        isManual: false,
    };
}

// ── Global: Fetch from GoldAPI.io ────────────────────────────────────────────
export async function fetchGoldApiPrices(currency = 'USD'): Promise<GoldPriceData> {
    const apiKey = process.env.GOLDAPI_KEY;
    if (!apiKey) throw new Error('GOLDAPI_KEY not configured in .env');

    const [goldRes, silverRes] = await Promise.all([
        fetch(`https://www.goldapi.io/api/XAU/${currency}`, {
            headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
            cache: 'no-store',
        }),
        fetch(`https://www.goldapi.io/api/XAG/${currency}`, {
            headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
            cache: 'no-store',
        }),
    ]);

    if (!goldRes.ok) throw new Error(`GoldAPI gold fetch failed: ${goldRes.status}`);
    if (!silverRes.ok) throw new Error(`GoldAPI silver fetch failed: ${silverRes.status}`);

    const gold = await goldRes.json();
    const silver = await silverRes.json();

    // GoldAPI returns price_gram_22k, price_gram_24k etc. directly!
    return {
        gold22kGram: parseFloat((gold.price_gram_22k ?? gold.price / 31.1035 * 0.9167).toFixed(2)),
        gold24kGram: parseFloat((gold.price_gram_24k ?? gold.price / 31.1035).toFixed(2)),
        gold21kGram: parseFloat((gold.price_gram_21k ?? gold.price / 31.1035 * 0.875).toFixed(2)),
        gold18kGram: parseFloat((gold.price_gram_18k ?? gold.price / 31.1035 * 0.75).toFixed(2)),
        silverPerGram: parseFloat((silver.price / 31.1035).toFixed(4)),
        currency,
        source: 'GoldAPI',
        isManual: false,
    };
}

// ── Shared: Save to DB ───────────────────────────────────────────────────────
export async function saveGoldPrices(data: GoldPriceData) {
    // @ts-ignore
    return await (prisma as any).goldSilverPrice.create({ data });
}

// ── Smart fetch: DB cache → fallback to live if >24h old ────────────────────
export async function getOrFetchGoldPrices(region: 'BD' | 'GLOBAL', currency = 'USD'): Promise<any> {
    const source = region === 'BD' ? 'BAJUS' : 'GoldAPI';
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Check DB for a fresh record (less than 24h old)
    // @ts-ignore
    const cached = await (prisma as any).goldSilverPrice.findFirst({
        where: { source, fetchedAt: { gte: since } },
        orderBy: { fetchedAt: 'desc' },
    });

    if (cached) return cached;  // Cache hit ✅

    // 2. Cache miss → fetch fresh data
    const fresh = region === 'BD'
        ? await scrapeBajusPrices()
        : await fetchGoldApiPrices(currency);

    return saveGoldPrices(fresh);  // Save + return the new record
}
