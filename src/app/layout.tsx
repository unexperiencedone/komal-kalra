import type { Metadata, Viewport } from 'next';
import { Public_Sans, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { BRAND } from '@/lib/config';
import './globals.css';

/**
 * Fonts are self-hosted through next/font: no render-blocking request to a
 * third-party CDN, no layout shift from a late swap, and no privacy question
 * about who is being told which pages a visitor loads.
 */
const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-public-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-playfair',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.fullName} — Astrology, Coaching & Counselling`,
    template: `%s — ${BRAND.fullName}`,
  },
  description:
    'One-to-one Vedic astrology consultations, Kundli Milan, coaching, healing and counselling with Komal Kalra. Book a private online session at a time that suits you.',
  keywords: [
    'astrologer Komal Kalra', 'online astrology consultation', 'kundli milan',
    'vedic astrology consultation', 'birth chart reading', 'life coach', 'counselling',
  ],
  authors: [{ name: BRAND.fullName }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: BRAND.fullName,
    title: `${BRAND.fullName} — Astrology, Coaching & Counselling`,
    description:
      'Private one-to-one consultations. Astrological guidance, Kundli Milan, coaching, healing and counselling.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.fullName}`,
    description: 'Private one-to-one astrology and counselling consultations.',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#fef9f2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${publicSans.variable} ${playfair.variable}`}>
      <body>
        {/* First focusable element on every page. */}
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#fff',
              border: '1px solid var(--color-outline-variant)',
              color: 'var(--color-cosmic-navy)',
            },
          }}
        />
      </body>
    </html>
  );
}
