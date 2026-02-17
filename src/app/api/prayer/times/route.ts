import { NextRequest, NextResponse } from 'next/server';
import { getPrayerTimes, getTimeUntilIftar, getTimeUntilSahri } from '@/lib/services/prayerService';

/**
 * GET /api/prayer/times
 * Fetch prayer times for a location
 * Query params: lat, lng, date (optional), method (optional)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const dateStr = searchParams.get('date');
        const method = searchParams.get('method') || 'Karachi';

        if (!lat || !lng) {
            return NextResponse.json(
                { error: 'Latitude and longitude are required' },
                { status: 400 }
            );
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const date = dateStr ? new Date(dateStr) : new Date();

        const prayerTimes = await getPrayerTimes(latitude, longitude, date, method);

        if (!prayerTimes) {
            return NextResponse.json(
                { error: 'Failed to fetch prayer times' },
                { status: 500 }
            );
        }

        // Get countdown times
        const timeUntilIftar = await getTimeUntilIftar(latitude, longitude, method);
        const timeUntilSahri = await getTimeUntilSahri(latitude, longitude, method);

        return NextResponse.json({
            success: true,
            data: {
                ...prayerTimes,
                countdowns: {
                    iftar: timeUntilIftar,
                    sahri: timeUntilSahri,
                },
            },
        });
    } catch (error) {
        console.error('Error in prayer times API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
