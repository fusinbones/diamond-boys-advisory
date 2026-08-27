import { NextRequest, NextResponse } from 'next/server';

/**
 * Shared gate for every /api/cron/* route.
 *
 * The routes previously guarded themselves like this:
 *
 *     if (process.env.CRON_SECRET && provided !== process.env.CRON_SECRET) {
 *         if (provided) return 401;      // only rejects a WRONG secret
 *     }                                  // omitting it entirely falls through
 *
 * Two separate holes. With CRON_SECRET unset the whole condition short-circuits
 * and never blocks, and even with it set, omitting the parameter passes while
 * supplying a wrong one is rejected. That rewards sending no credential at all.
 *
 * This fails CLOSED: no configured secret means nobody gets in, and a missing
 * parameter is treated exactly like a wrong one. These routes write to a
 * database shared with tripleplayz.com, so an open cron is not a small thing.
 *
 * Accepts the secret as `?secret=` or as `Authorization: Bearer <secret>`,
 * which is the shape Vercel Cron sends if scheduled jobs are ever re-enabled.
 *
 * Returns a response to send back, or null when the caller is authorised.
 */
export function denyUnlessCron(request: NextRequest): NextResponse | null {
    const expected = process.env.CRON_SECRET;

    if (!expected) {
        console.error('[cron] CRON_SECRET is not configured; refusing the request');
        return NextResponse.json(
            { error: 'Cron is not configured' },
            { status: 503 },
        );
    }

    const header = request.headers.get('authorization') || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const provided = request.nextUrl.searchParams.get('secret') || bearer;

    if (!provided || !safeEqual(provided, expected)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return null;
}

/** Length-independent constant-time comparison. */
function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}
