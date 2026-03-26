import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import IOSInstallPrompt from '@/components/IOSInstallPrompt';
import PickAlertBanner from '@/components/PickAlertBanner';
import PickDropToast from '@/components/PickDropToast';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'TriplePlayz - Sports Advisory | Elite Sports Picks & Community',
  description:
    'Expert sports picks from TriplePlayz - Sports Advisory. Join our exclusive TriplePlayz Lounge community with daily expert analysis, 30+ years of experience, and documented picks across MLB, NBA, NFL & NHL.',
  keywords: [
    'sports picks',
    'sports advisory',
    'TriplePlayz',
    'sports betting community',
    'sports picks subscription',
    'expert picks',
    'sports analysis',
    'sports betting picks',
  ],
  openGraph: {
    title: 'TriplePlayz - Sports Advisory | Expert Sports Picks',
    description: 'Expert daily sports picks backed by 30+ years of experience and a premium community.',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TriplePlayz - Sports Advisory',
    description: 'Premium sports picks + elite TriplePlayz Lounge community.',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TriplePlayz" />
        <meta name="theme-color" content="#040810" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <div className="bg-glow" />
          <Analytics />
          <Navbar />
          <main className="flex-1 relative z-10" style={{ paddingTop: '96px' }}>
            {children}
          </main>
          <Footer />
          <IOSInstallPrompt />
          <PickAlertBanner />
          <PickDropToast />
        </AuthProvider>
      </body>
    </html>
  );
}
