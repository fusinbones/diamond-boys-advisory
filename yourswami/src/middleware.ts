import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side admin gate for the entire /api/admin/* surface.
 *
 * Every admin API route is protected here in one place so no route can be
 * left unauthenticated by accident. Auth is a real Supabase session token
 * (JWT) sent as `Authorization: Bearer <access_token>` — never a client
 * self-asserted header. The token is validated against Supabase Auth and the
 * user's email/role is checked for admin status.
 *
 * The only exception is `GET /api/admin/fire-picks`, which the public
 * track-record widget reads; that route sanitizes its own output for
 * non-admins (revealed picks only).
 */

export const config = {
    matcher: ['/api/admin/:path*'],
};

// Hardcoded super-admins (the real login identities; kept on tripleplayz.com
// until the mailbox migration, see project notes). ADMIN_EMAILS env extends this.
const SUPER_ADMINS = [
    'support@tripleplayz.com',
    'diamondboysadvisory@gmail.com',
    'admin@tripleplayz.com',
];

function envAdmins(): string[] {
    return (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

async function isAdminRequest(request: NextRequest): Promise<boolean> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7).trim();
    if (!token) return false;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return false;
    const serviceKey =
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || anon;

    // 1. Validate the token and resolve the user (edge-safe: plain fetch).
    let user: { id?: string; email?: string } | null = null;
    try {
        const res = await fetch(`${url}/auth/v1/user`, {
            headers: { Authorization: `Bearer ${token}`, apikey: anon },
        });
        if (!res.ok) return false;
        user = await res.json();
    } catch {
        return false;
    }
    const email = (user?.email || '').toLowerCase();
    if (!email) return false;

    // 2. Static allowlist (super-admins + ADMIN_EMAILS env).
    if (SUPER_ADMINS.includes(email) || envAdmins().includes(email)) return true;

    // 3. Dynamic admins flagged in user_profiles.
    if (user?.id) {
        try {
            const res = await fetch(
                `${url}/rest/v1/user_profiles?id=eq.${user.id}&select=is_admin,role`,
                { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
            );
            if (res.ok) {
                const rows = await res.json();
                const p = Array.isArray(rows) ? rows[0] : null;
                if (p && (p.is_admin || p.role === 'admin' || p.role === 'staff')) return true;
            }
        } catch {
            /* fall through to deny */
        }
    }

    return false;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public exception: revealed fire-pick track record (route sanitizes output).
    if (request.method === 'GET' && pathname === '/api/admin/fire-picks') {
        return NextResponse.next();
    }

    if (!(await isAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
}
