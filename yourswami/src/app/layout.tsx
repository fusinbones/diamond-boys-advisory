import type { Metadata } from 'next';
import './globals.css';
import Analytics from '@/components/Analytics';
import RefTracker from '@/components/RefTracker';
import { AuthProvider } from '@/components/AuthProvider';
import LayoutShell from '@/components/LayoutShell';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://yourswami.com'),
  title: 'YourSwami | Real Picks. Real Results. Real Cash.',
  description:
    'YourSwami delivers premium sports picks backed by 30+ years of analysis. Real picks, no guesswork. Real results, proven record. Follow the Swami.',
  keywords: [
    'YourSwami',
    'sports picks',
    'sports advisory',
    'sports betting community',
    'sports picks subscription',
    'expert picks',
    'sports analysis',
    'the swami',
  ],
  icons: {
    icon: '/favicon-32.png',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'YourSwami | Real Picks. Real Results. Real Cash.',
    description: 'Premium sports picks backed by 30+ years of analysis. Follow the Swami.',
    type: 'website',
    url: 'https://yourswami.com',
    siteName: 'YourSwami',
    images: ['/brand/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YourSwami | Real Picks. Real Results. Real Cash.',
    description: 'Premium sports picks backed by 30+ years of analysis. Follow the Swami.',
    images: ['/brand/og-image.png'],
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="YourSwami" />
        <meta name="theme-color" content="#0a0512" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <Analytics />
          <LayoutShell>{children}</LayoutShell>
          <RefTracker />
        </AuthProvider>
        {/* GoHighLevel (LeadConnector) chat widget: sole SMS opt-in / A2P consent collector.
            Raw <script> (not next/script) so the tag is present in the server-rendered HTML
            for the A2P compliance crawler, and still executes for real users. */}
        <script
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6a80ddd7b7fff8e529a1229d"
          data-source="WEB_USER"
          async
        ></script>
      </body>
    </html>
  );
}

