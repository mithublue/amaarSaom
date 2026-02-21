import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';

/**
 * POST /api/system-admin/scrape-gold
 * Fetches BAJUS gold price page and parses current gold/silver prices.
 * Admin-only. Also supports manual price override via body params.
 */
export async function POST(req: NextRequest) {
    const session = await requireAdmin();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json().catch(() => ({}));

        // ── Manual override mode ─────────────────────────────────────────
        if (body.manual) {
            const { goldPer22KGram, goldPer24KGram, goldPer21KGram, goldPer18KGram, silverPerGram } = body;
            if (!goldPer22KGram) {
                return NextResponse.json({ error: 'goldPer22KGram is required for manual entry' }, { status: 400 });
            }
            // @ts-ignore - prisma generate needed
            const saved = await (prisma as any).goldSilverPrice.create({
                data: {
                    goldPer22KGram: parseFloat(goldPer22KGram),
                    goldPer24KGram: parseFloat(goldPer24KGram ?? goldPer22KGram * 1.095),
                    goldPer21KGram: parseFloat(goldPer21KGram ?? goldPer22KGram * 0.955),
                    goldPer18KGram: parseFloat(goldPer18KGram ?? goldPer22KGram * 0.818),
                    silverPerGram: parseFloat(silverPerGram ?? 145),
                    isManual: true,
                    source: 'Manual',
                },
            });
            return NextResponse.json({ success: true, data: saved, source: 'manual' });
        }

        // ── BAJUS scrape mode ────────────────────────────────────────────
        const bajusRes = await fetch('https://www.bajus.org/gold-price', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NuzulApp/1.0)',
                'Accept': 'text/html',
            },
            next: { revalidate: 0 },
        });

        if (!bajusRes.ok) {
            throw new Error(`BAJUS returned ${bajusRes.status}`);
        }

        const html = await bajusRes.text();

        // Simple regex-based parsing — adjust if BAJUS changes their HTML
        // Looks for price patterns like 8,500 or 8500 near karat labels
        const extractPrice = (label: string): number | null => {
            const re = new RegExp(label + '[^\\d]*(\\d[\\d,]+)', 'i');
            const m = html.match(re);
            if (!m) return null;
            return parseFloat(m[1].replace(/,/g, ''));
        };

        const goldPer22K = extractPrice('22') ?? extractPrice('22K') ?? null;
        const goldPer24K = extractPrice('24') ?? extractPrice('24K') ?? null;
        const goldPer21K = extractPrice('21') ?? extractPrice('21K') ?? null;
        const goldPer18K = extractPrice('18') ?? extractPrice('18K') ?? null;
        const silver = extractPrice('silver') ?? extractPrice('রুপা') ?? null;

        if (!goldPer22K) {
            return NextResponse.json({
                success: false,
                error: 'Could not parse BAJUS page. Please use manual entry.',
                html_snippet: html.substring(0, 500),
            }, { status: 422 });
        }

        // Price from BAJUS is per ভরি (tola) — convert to per gram (1 tola = 11.664g)
        const TOLA_TO_GRAM = 11.664;
        const g22 = goldPer22K / TOLA_TO_GRAM;
        const g24 = (goldPer24K ?? goldPer22K * 1.095) / TOLA_TO_GRAM;
        const g21 = (goldPer21K ?? goldPer22K * 0.955) / TOLA_TO_GRAM;
        const g18 = (goldPer18K ?? goldPer22K * 0.818) / TOLA_TO_GRAM;
        const sGram = silver ? silver / TOLA_TO_GRAM : 145;

        const { prisma } = await import('@/lib/db/prisma');
        // @ts-ignore - prisma generate needed
        const saved = await (prisma as any).goldSilverPrice.create({
            data: {
                goldPer22KGram: parseFloat(g22.toFixed(2)),
                goldPer24KGram: parseFloat(g24.toFixed(2)),
                goldPer21KGram: parseFloat(g21.toFixed(2)),
                goldPer18KGram: parseFloat(g18.toFixed(2)),
                silverPerGram: parseFloat(sGram.toFixed(2)),
                source: 'BAJUS',
                isManual: false,
            },
        });

        return NextResponse.json({ success: true, data: saved, source: 'bajus' });
    } catch (error) {
        console.error('[ScrapeGold] Error:', error);
        return NextResponse.json({
            error: 'Scraping failed. Use manual entry instead.',
            detail: (error as Error).message,
        }, { status: 500 });
    }
}
