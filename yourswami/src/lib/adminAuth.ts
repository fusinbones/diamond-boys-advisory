'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';

// Admin emails whitelist — add team emails here
const ADMIN_EMAILS = [
    'support@tripleplayz.com',
    'diamondboysadvisory@gmail.com',
];

export function useAdminAuth() {
    const { user, loading: authLoading, signOut } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkAdminStatus = async () => {
            if (authLoading) return;

            if (!user?.email) {
                if (mounted) {
                    setIsAdmin(false);
                    setLoading(false);
                }
                return;
            }

            // Fast path for hardcoded super admins
            if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                if (mounted) {
                    setIsAdmin(true);
                    setLoading(false);
                }
                return;
            }

            // Database check for dynamic admins
            try {
                const { supabase } = await import('@/lib/supabase');
                const { data } = await supabase
                    .from('user_profiles')
                    .select('is_admin, role')
                    .eq('id', user.id)
                    .single();

                if (mounted && data) {
                    setIsAdmin(data.is_admin || data.role === 'admin' || data.role === 'staff');
                } else if (mounted) {
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error('Failed to verify admin status:', err);
                if (mounted) setIsAdmin(false);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        checkAdminStatus();

        return () => {
            mounted = false;
        };
    }, [user, authLoading]);

    return { user, isAdmin, loading: loading || authLoading, signOut };
}

export function isAdminEmail(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}
