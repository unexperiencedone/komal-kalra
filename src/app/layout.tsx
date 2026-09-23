import type { Metadata, Viewport } from 'next';
import { Poppins, Cormorant_Garamond } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import { BRAND } from '@/lib/config';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';

/**
 * Fonts are self-hosted through next/font: no render-blocking request to a
 * third-party CDN, no layout shift from a late swap, and no privacy question
 * about who is being told which pages a visitor loads.
 */
/**
 * Poppins — body and UI.
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

/**
 * Cormorant Garamond — display only.
 *
 * A Garamond revival: old-style, high-contrast, and the serif lineage that
 * luxury houses actually use. Replaces Playfair Display, which is the most
 * over-used serif on the web and reads as a default rather than a choice.
 *
 * Weights 500/600 and true italics (the pull quote on /about is set in italic,
 * and a synthesised oblique would be obvious at that size).
 *
 * NOTE ON WEIGHT: Cormorant is drawn light. Where Playfair looked right at 500,
 * Cormorant needs 600 below about 32px or it goes weak against the ivory
 * ground — see the h2/h3 rules in globals.css.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.astrokomalkalra.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.fullName} — Expert Astrology, Coaching & Healing`,
    template: `%s — ${BRAND.fullName}`,
  },
  description:
    'Transform your life with expert guidance from Astrologer Komal Kalra. Book private, one-to-one online sessions for in-depth Vedic astrology readings, Kundli Milan, compassionate life coaching, and spiritual healing.',
  keywords: [
    'astrologer Komal Kalra', 'online astrology consultation', 'kundli milan',
    'vedic astrology consultation', 'birth chart reading', 'life coach', 'spiritual healing', 'counselling',
  ],
  authors: [{ name: BRAND.fullName }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Astro Komal Kalra',
    title: `${BRAND.fullName} — Expert Astrology, Coaching & Healing`,
    description:
      'Unlock your true potential with Astrologer Komal Kalra. Explore personalized Vedic astrology insights, Kundli Milan, and transformative life coaching. Book a private, one-to-one online consultation today.',
    // Fallback for any page that doesn't set its own openGraph.images.
    images: [{ url: '/images/logo.png', width: 1024, height: 1024, alt: BRAND.fullName }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.fullName} — Expert Astrology, Coaching & Healing`,
    description: 'Transform your life with personalized Vedic astrology insights, Kundli Milan, life coaching, and spiritual healing by Astrologer Komal Kalra.',
    images: ['/images/logo.png'],
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },

  /**
   * Google Search Console ownership verification.
   *
   * Next.js emits this as <meta name="google-site-verification"> on every page
   * from the root layout, which is what Search Console's HTML-tag method looks
   * for. Using the `verification` field rather than a hand-written <meta> keeps
   * it in the metadata system, so it cannot be lost if <head> is refactored.
   *
   * Also required for the Google OAuth consent screen: verifying the domain
   * here is what removes the "unverified app" interstitial and lets the
   * practice name show properly. See docs/google-auth-setup.md.
   */
  verification: {
    google: '_tba18Z8obrGcgCxx7h8p40imo3yePPFNom0TRdCR_8',
  },
};

export const viewport: Viewport = {
  themeColor: '#fff7ec',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${cormorant.variable}`}>
      <body>
        {/* First focusable element on every page. */}
        <a href="#main" className="skip-link">Skip to content</a>
        {/*
          Wraps everything so the header's toggle and the booking flow share one
          locale. The provider renders English on the server and switches after
          mount — see LanguageProvider for why it must not read localStorage
          during render.
        */}
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#fff',
              border: '1px solid var(--color-hairline)',
              color: 'var(--color-body-warm)',
            },
          }}
        />
        {/* Vercel Web Analytics — page views on the production domain. */}
        <Analytics />
      </body>
    </html>
  );
}
