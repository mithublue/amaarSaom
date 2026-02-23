import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { saveGoldPrices, scrapeBajusPrices, fetchGoldApiPrices } from '@/lib/zakat/goldSync';

/**
 * POST /api/system-admin/scrape-gold
 * Admin-only. Force-refresh gold prices from BAJUS or GoldAPI.io, or manually enter prices.
 * Body: { manual?: bool, region?: 'BD'|'GLOBAL', currency?: string, ...prices }
 */
export async function POST(req: NextRequest) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    try {
        const body = await req.json().catch(() => ({}));

        // ── Manual override ──────────────────────────────────────────────
        if (body.manual) {
            const { gold22kGram, gold24kGram, gold21kGram, gold18kGram, silverPerGram, currency = 'BDT' } = body;
            if (!gold22kGram) {
                return NextResponse.json({ error: 'gold22kGram is required for manual entry' }, { status: 400 });
            }
            const saved = await saveGoldPrices({
                gold22kGram: parseFloat(gold22kGram),
                gold24kGram: parseFloat(gold24kGram ?? gold22kGram * 1.095),
                gold21kGram: parseFloat(gold21kGram ?? gold22kGram * 0.955),
                gold18kGram: parseFloat(gold18kGram ?? gold22kGram * 0.818),
                silverPerGram: parseFloat(silverPerGram ?? 145),
                currency,
                isManual: true,
                source: 'Manual',
            });
            return NextResponse.json({ success: true, data: saved, source: 'manual' });
        }

        // ── Force live fetch (ignoring cache) ────────────────────────────
        const region = (body.region ?? 'BD').toUpperCase();
        const currency = (body.currency ?? 'BDT').toUpperCase();

        const fresh = region === 'GLOBAL'
            ? await fetchGoldApiPrices(currency)
            : await scrapeBajusPrices();

        const saved = await saveGoldPrices(fresh);
        return NextResponse.json({ success: true, data: saved, source: fresh.source });

    } catch (error) {
        console.error('[ScrapeGold] Error:', error);
        return NextResponse.json({
            error: 'Gold sync failed. Try manual entry.',
            detail: (error as Error).message,
        }, { status: 500 });
    }
}
