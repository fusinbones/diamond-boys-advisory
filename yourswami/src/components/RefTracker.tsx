'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const REF_KEY = 'tp_ref';
const REF_TS_KEY = 'tp_ref_ts';
const COOKIE_DAYS = 30;

/**
 * Inner component that reads search params — must be inside Suspense.
 */
function RefTrackerInner() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (!ref) return;

        // Validate format: 2-7 alphanumeric chars (MIKE7, ANDY3) or legacy TP-XXXXXX
        if (!/^[A-Z0-9]{2,7}$/i.test(ref) && !/^TP-[A-Z0-9]{6}$/i.test(ref)) return;

        const code = ref.toUpperCase();

        // Store in localStorage with timestamp
        localStorage.setItem(REF_KEY, code);
        localStorage.setItem(REF_TS_KEY, Date.now().toString());

        // Also set a cookie for potential server-side access
        const expires = new Date(Date.now() + COOKIE_DAYS * 86400000).toUTCString();
        document.cookie = `tp_ref=${code}; path=/; expires=${expires}; SameSite=Lax`;

        // Clean the URL without triggering a navigation
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        window.history.replaceState(null, '', url.pathname + url.search);
    }, [searchParams]);

    return null;
}

/**
 * Silent component that captures ?ref=TP-XXXXXX from the URL
 * and persists it in localStorage + cookie for 30 days.
 * Zero UI — just mount it in the root layout.
 */
export default function RefTracker() {
    return (
        <Suspense fallback={null}>
            <RefTrackerInner />
        </Suspense>
    );
}

/**
 * Helper to read the stored referral code (client-side only).
 * Returns null if no code or if expired (30 days).
 */
export function getStoredRefCode(): string | null {
    if (typeof window === 'undefined') return null;

    const code = localStorage.getItem(REF_KEY);
    const ts = localStorage.getItem(REF_TS_KEY);

    if (!code || !ts) return null;

    // Check expiry
    const age = Date.now() - parseInt(ts, 10);
    if (age > COOKIE_DAYS * 86400000) {
        localStorage.removeItem(REF_KEY);
        localStorage.removeItem(REF_TS_KEY);
        return null;
    }

    return code;
}
