import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import IOSInstallPrompt from '@/components/IOSInstallPrompt';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Diamond Boys Sports Advisory | Elite MLB Baseball Picks & Discord Community',
  description:
    'Unlock winning MLB baseball picks from Diamond Boys Sports Advisory. Join our exclusive Discord community with daily expert analysis, proven picks, and a 65% win rate. Sign up for early access now.',
  keywords: [
    'MLB picks',
    'sports advisory',
    'Diamond Boys',
    'Discord betting community',
    'sports picks subscription',
    'MLB picks',
    'baseball analysis',
    'sports betting picks',
  ],
  openGraph: {
    title: 'Diamond Boys Sports Advisory | Winning MLB Baseball Picks',
    description: 'Join 1,200+ members getting daily winning MLB picks and exclusive Discord access.',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diamond Boys Sports Advisory',
    description: 'Premium MLB baseball picks + elite Discord community.',
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
        <meta name="apple-mobile-web-app-title" content="Diamond Boys" />
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
        </AuthProvider>
      </body>
    </html>
  );
}
