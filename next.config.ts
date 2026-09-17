import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
