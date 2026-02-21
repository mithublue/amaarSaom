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
            const { goldPer22KGram, goldPer24KGram, goldPer21KGram, goldPer18KGram, silverPerGram, currency = 'BDT' } = body;
            if (!goldPer22KGram) {
                return NextResponse.json({ error: 'goldPer22KGram is required for manual entry' }, { status: 400 });
            }
            const saved = await saveGoldPrices({
                goldPer22KGram: parseFloat(goldPer22KGram),
                goldPer24KGram: parseFloat(goldPer24KGram ?? goldPer22KGram * 1.095),
                goldPer21KGram: parseFloat(goldPer21KGram ?? goldPer22KGram * 0.955),
                goldPer18KGram: parseFloat(goldPer18KGram ?? goldPer22KGram * 0.818),
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
