import { createClient } from '@supabase/supabase-js';

/**
 * Server-side admin identity resolution from a Supabase Bearer token.
 *
 * The blanket admin GATE lives in src/middleware.ts. This helper is for the
 * one public-exempt admin route (GET /api/admin/fire-picks) that must decide
 * per-request whether to reveal full (admin) or sanitized (public) data.
 */

const SUPER_ADMINS = [
    'support@tripleplayz.com',
    'diamondboysadvisory@gmail.com',
    'admin@tripleplayz.com',
];

function svc() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY ||
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

function isAdminEmail(email: string): boolean {
    // ADMIN_EMAILS_EXTRA is additive, see the note in src/middleware.ts.
    const env = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAILS_EXTRA]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    return SUPER_ADMINS.includes(email) || env.includes(email);
}

/** Returns {id,email} only if the Bearer token belongs to a verified admin, else null. */
export async function getAdminUser(request: Request): Promise<{ id: string; email: string } | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    if (!token) return null;

    const supabase = svc();
    let id: string;
    let email: string;
    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user?.email) return null;
        id = data.user.id;
        email = data.user.email.toLowerCase();
    } catch {
        return null;
    }

    if (isAdminEmail(email)) return { id, email };

    try {
        const { data: prof } = await supabase
            .from('user_profiles')
            .select('is_admin, role')
            .eq('id', id)
            .single();
        if (prof && (prof.is_admin || prof.role === 'admin' || prof.role === 'staff')) {
            return { id, email };
        }
    } catch {
        /* deny */
    }
    return null;
}
