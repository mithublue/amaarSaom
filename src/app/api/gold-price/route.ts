import { NextRequest, NextResponse } from 'next/server';
import { getOrFetchGoldPrices } from '@/lib/zakat/goldSync';

/**
 * GET /api/gold-price
 *
 * Region is detected SERVER-SIDE from the real request IP — NOT from client timezone.
 * This means VPN users are correctly detected.
 *
 * Detection chain:
 * 1. Vercel geo header (x-vercel-ip-country) — works on Vercel automatically
 * 2. CF-IPCountry header — works if behind Cloudflare
 * 3. ipapi.co free lookup using X-Forwarded-For IP
 * 4. Fallback → BD
 *
 * Logic:
 * - country === 'BD' → fetch from BAJUS (BDT)
 * - any other country → fetch from GoldAPI.io
 *
 * Caching: DB record < 24h old → returned immediately, no external call.
 */
export async function GET(req: NextRequest) {
    try {
        // ── 1. Try Vercel's automatic geo header ──────────────────────────
        let countryCode = req.headers.get('x-vercel-ip-country')
            ?? req.headers.get('cf-ipcountry')  // Cloudflare fallback
            ?? null;

        // ── 2. If no header (local dev / custom server), use ipapi.co ────
        if (!countryCode) {
            const forwarded = req.headers.get('x-forwarded-for');
            const ip = forwarded ? forwarded.split(',')[0].trim() : null;

            // Skip loopback/private IPs (local dev) — treat as BD
            const isPrivateIp = !ip
                || ip === '127.0.0.1'
                || ip === '::1'
                || ip.startsWith('192.168.')
                || ip.startsWith('10.')
                || ip.startsWith('172.');

            if (!isPrivateIp && ip) {
                try {
                    const geo = await fetch(`https://ipapi.co/${ip}/country/`, {
                        headers: { 'User-Agent': 'NuzulApp/1.0' },
                        next: { revalidate: 3600 }, // Cache 1h to avoid rate limits
                    });
                    if (geo.ok) countryCode = (await geo.text()).trim();
                } catch {
                    // ipapi.co down — fall through to BD default
                }
            }
        }

        // ── 3. Map country code to region ─────────────────────────────────
        // Only go GLOBAL if we KNOW it's a non-BD country.
        // null (localhost/private IP/unknown) → fallback to BD.
        const region: 'BD' | 'GLOBAL' = (countryCode && countryCode !== 'BD') ? 'GLOBAL' : 'BD';

        // ── 4. Map country to currency for display ────────────────────────
        const currencyMap: Record<string, string> = {
            SA: 'SAR', AE: 'AED', GB: 'GBP', US: 'USD',
            IN: 'INR', PK: 'PKR', MY: 'MYR', AU: 'AUD',
            CA: 'CAD', EU: 'EUR', TR: 'TRY', NG: 'NGN',
        };
        const currency = region === 'BD'
            ? 'BDT'
            : (countryCode ? (currencyMap[countryCode] ?? 'USD') : 'USD');

        const data = await getOrFetchGoldPrices(region, currency);

        return NextResponse.json({
            success: true,
            region,
            currency,
            countryCode,
            data,
        });

    } catch (error) {
        console.error('[GoldPrice] GET error:', error);

        // On any failure, return BDT defaults so the UI never breaks
        return NextResponse.json({
            success: true,
            region: 'BD',
            currency: 'BDT',
            fallback: true,
            data: {
                goldPer22KGram: 8500,
                goldPer24KGram: 9300,
                goldPer21KGram: 8150,
                goldPer18KGram: 7000,
                silverPerGram: 145,
                currency: 'BDT',
                source: 'default',
                isManual: false,
                fetchedAt: null,
            },
        });
    }
}
