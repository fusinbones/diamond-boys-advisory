'use client';

import { supabase } from '@/lib/supabase';

/**
 * Drop-in replacement for `fetch` when calling `/api/admin/*` endpoints.
 *
 * Attaches the current Supabase session's access token as a Bearer header so
 * the server-side admin gate (src/middleware.ts) can verify the caller is a
 * real, authenticated admin. Never send self-asserted identity headers.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
    let token: string | undefined;
    try {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token;
    } catch {
        /* no session -> request will be rejected by the server gate */
    }

    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, { ...init, headers });
}
