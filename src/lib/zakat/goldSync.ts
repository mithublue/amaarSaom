import { prisma } from '@/lib/db/prisma';

export const TOLA_TO_GRAM = 11.664;

export interface GoldPriceData {
    goldPer22KGram: number;
    goldPer24KGram: number;
    goldPer21KGram: number;
    goldPer18KGram: number;
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

    const extractPrice = (label: string): number | null => {
        const re = new RegExp(label + '[^\\d]*(\\d[\\d,]+)', 'i');
        const m = html.match(re);
        return m ? parseFloat(m[1].replace(/,/g, '')) : null;
    };

    const goldPer22K = extractPrice('22') ?? extractPrice('22K');
    const goldPer24K = extractPrice('24') ?? extractPrice('24K');
    const goldPer21K = extractPrice('21') ?? extractPrice('21K');
    const goldPer18K = extractPrice('18') ?? extractPrice('18K');
    const silver = extractPrice('silver') ?? extractPrice('রুপা');

    if (!goldPer22K) throw new Error('Could not parse BAJUS gold price (22K missing)');

    // BAJUS prices are per ভরি (tola) — convert to per gram
    return {
        goldPer22KGram: parseFloat((goldPer22K / TOLA_TO_GRAM).toFixed(2)),
        goldPer24KGram: parseFloat(((goldPer24K ?? goldPer22K * 1.095) / TOLA_TO_GRAM).toFixed(2)),
        goldPer21KGram: parseFloat(((goldPer21K ?? goldPer22K * 0.955) / TOLA_TO_GRAM).toFixed(2)),
        goldPer18KGram: parseFloat(((goldPer18K ?? goldPer22K * 0.818) / TOLA_TO_GRAM).toFixed(2)),
        silverPerGram: parseFloat(((silver ?? goldPer22K * 0.017) / TOLA_TO_GRAM).toFixed(2)),
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
        goldPer22KGram: parseFloat((gold.price_gram_22k ?? gold.price / 31.1035 * 0.9167).toFixed(2)),
        goldPer24KGram: parseFloat((gold.price_gram_24k ?? gold.price / 31.1035).toFixed(2)),
        goldPer21KGram: parseFloat((gold.price_gram_21k ?? gold.price / 31.1035 * 0.875).toFixed(2)),
        goldPer18KGram: parseFloat((gold.price_gram_18k ?? gold.price / 31.1035 * 0.75).toFixed(2)),
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
