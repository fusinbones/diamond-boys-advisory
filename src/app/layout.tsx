import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Diamond Boys Sports Advisory | Elite College Basketball Picks & Discord Community',
  description:
    'Unlock winning college basketball picks from Diamond Boys Sports Advisory. Join our exclusive Discord community with daily expert analysis, proven picks, and a 65% win rate. Subscribe now for premium sports advisory.',
  keywords: [
    'college basketball picks',
    'sports advisory',
    'Diamond Boys',
    'Discord betting community',
    'sports picks subscription',
    'NCAAB picks',
    'basketball analysis',
    'sports betting picks',
  ],
  openGraph: {
    title: 'Diamond Boys Sports Advisory | Winning College Basketball Picks',
    description: 'Join 1,200+ members getting daily winning college basketball picks and exclusive Discord access.',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diamond Boys Sports Advisory',
    description: 'Premium college basketball picks + elite Discord community.',
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
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <div className="bg-glow" />
          <Analytics />
          <Navbar />
          <main className="flex-1 relative z-10" style={{ paddingTop: '96px' }}>
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
