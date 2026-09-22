import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      /*
        The placeholder topic catalogue, retired.

        19_seed.sql shipped five services whose copy and prices it labelled as
        placeholders in its own header, and they were live long enough to be
        indexed. database/36_consultation_catalogue.sql archives them and
        publishes the practice's real fee sheet in their place, so these five
        URLs now 404.

        `permanent: true` — 308, the same status the domain redirect below
        uses. Next emits 307/308 rather than 302/301 on purpose (it preserves
        the request method; see its redirects config docs), and these are
        permanent moves: the old pages are not coming back, so the ranking
        should transfer rather than be held at a temporary redirect.

        `statusCode` would force a literal 301, but the two options are
        mutually exclusive in Next's Redirect type and there is no old client
        here that needs the distinction — the callers are crawlers and
        browsers, both of which handle 308.

        Each lands on the consultation that replaced it rather than all five
        dumping onto /services, so someone arriving from a search for "kundli
        milan" gets the in-depth Kundli session, not a list to re-read.
      */
      {
        source: '/services/astrological-guidance',
        destination: '/services/consultation-40',
        permanent: true,
      },
      {
        source: '/services/kundli-milan',
        destination: '/services/in-depth-kundli',
        permanent: true,
      },
      {
        source: '/services/life-coaching',
        destination: '/services/consultation-40',
        permanent: true,
      },
      {
        source: '/services/healing-session',
        destination: '/services/consultation-25',
        permanent: true,
      },
      {
        source: '/services/counselling',
        destination: '/services/consultation-25',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'komal-kalra.vercel.app',
          },
        ],
        destination: 'https://www.astrokomalkalra.com/:path*',
        permanent: true, // 308 Permanent Redirect
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'komal-kalra.vercel.app',
          },
        ],
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
  images: {
    /**
     * All brand photography is served from /public/images (see
     * src/lib/content/imagery.ts, USE_LOCAL_IMAGES = true) — no remote pattern
     * needed for that. lh3.googleusercontent.com is different: it's a Google
     * *account* avatar URL, genuinely external and per-user, read from
     * user_metadata.avatar_url after Google sign-in (src/lib/auth/session.ts).
     */
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      /**
       * YouTube video thumbnails, for the "latest from the channel" section.
       *
       * Routed through next/image ON PURPOSE. A plain <img> pointing at
       * i.ytimg.com makes every visitor's browser call Google before they have
       * asked for anything — which is the tracking exposure the click-to-load
       * players elsewhere on the page were built to avoid. Optimising them
       * here means the browser requests our own domain and the server fetches
       * the image once.
       */
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
