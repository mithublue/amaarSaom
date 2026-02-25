'use client';

/**
 * ReferralTracker
 * 
 * This component silently reads any `?ref=CODE` parameter from the URL
 * and stores it in a secure cookie that lasts 7 days.
 * This ensures that even if the user navigates away from the initial
 * referral link, the referral code is still captured at registration.
 *
 * It renders nothing — it's purely a side-effect component.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const COOKIE_NAME = 'ref_code';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export default function ReferralTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (!ref) return;

        // Validate: only uppercase alphanumeric, 6-12 chars
        if (!/^[A-Z0-9]{6,12}$/.test(ref.toUpperCase())) return;

        const sanitized = ref.toUpperCase();

        // Store in a cookie so it persists across page navigations
        document.cookie = [
            `${COOKIE_NAME}=${sanitized}`,
            `Max-Age=${COOKIE_MAX_AGE}`,
            'Path=/',
            'SameSite=Lax',
            // Do NOT set HttpOnly — we need JS access at registration
        ].join('; ');
    }, [searchParams]);

    return null;
}
