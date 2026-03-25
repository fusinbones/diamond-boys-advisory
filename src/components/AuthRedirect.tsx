'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

/**
 * AuthRedirect — checks if user is logged in and redirects to /dashboard.
 * Renders nothing visible. Include at the top of the landing page.
 */
export default function AuthRedirect() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    return null;
}
