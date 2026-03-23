'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';

// Admin emails whitelist — add team emails here
const ADMIN_EMAILS = [
    'support@tripleplayz.com',
];

export function useAdminAuth() {
    const { user, loading: authLoading, signOut } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
        setLoading(false);
    }, [user, authLoading]);

    return { user, isAdmin, loading: loading || authLoading, signOut };
}

export function isAdminEmail(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}
