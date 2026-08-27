'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import IOSInstallPrompt from '@/components/IOSInstallPrompt';
import PickAlertBanner from '@/components/PickAlertBanner';
import PickDropToast from '@/components/PickDropToast';

/**
 * Layout shell: renders the navbar, footer and global chrome.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
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
