import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/gold-price
 * Returns the latest gold & silver prices from DB.
 * Public — used by the Zakat Calculator client.
 */
export async function GET() {
    try {
        // @ts-ignore - prisma generate needed
        const latest = await (prisma as any).goldSilverPrice.findFirst({
            orderBy: { fetchedAt: 'desc' },
        });

        if (!latest) {
            // No price in DB yet — return sensible defaults so the UI still works
            return NextResponse.json({
                success: true,
                data: {
                    goldPer22KGram: 8500,  // approx BDT fallback
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

        return NextResponse.json({ success: true, data: latest });
    } catch (error) {
        console.error('[GoldPrice] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch gold price' }, { status: 500 });
    }
}
