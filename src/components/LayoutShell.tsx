'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import IOSInstallPrompt from '@/components/IOSInstallPrompt';
import PickAlertBanner from '@/components/PickAlertBanner';
import PickDropToast from '@/components/PickDropToast';

/**
 * Layout shell — conditionally renders navbar/footer/chrome.
 * Routes under /course get a clean, isolated funnel layout.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFunnel = pathname.startsWith('/course');

    if (isFunnel) {
        return <>{children}</>;
    }

    return (
        <>
            <div className="bg-glow" />
            <Navbar />
            <main className="flex-1 relative z-10" style={{ paddingTop: '96px' }}>
                {children}
            </main>
            <Footer />
            <IOSInstallPrompt />
            <PickAlertBanner />
            <PickDropToast />
        </>
    );
}
