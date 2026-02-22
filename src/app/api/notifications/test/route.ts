import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { sendPushToUser } from '@/lib/firebase/firebaseAdmin';

/**
 * GET /api/notifications/test
 * Sends a test push notification to the currently logged-in user.
 * Use this to verify if notifications show up on your mobile home screen.
 */
export async function GET() {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized. Please login first.' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    
    try {
        const success = await sendPushToUser(
            userId,
            'Nuzul Test 🚀',
            'আপনার পুশ নোটিফিকেশন সিস্টেম এখন সচল! এটি আপনার হোম স্ক্রিনে দেখা যাওয়ার কথা।',
            { type: 'test_push', click_action: '/profile' }
        );

        if (success) {
            return NextResponse.json({ 
                success: true, 
                message: 'Test push sent successfully! Check your device notification bar/lock screen.' 
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                message: 'No active push subscriptions found. Did you click "Enable" in the Profile -> Notifications tab?'
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Test push error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Failed to send test push' 
        }, { status: 500 });
    }
}
