import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    /**
     * Stitch-hosted brand photography.
     *
     * Development convenience only. These URLs can rotate without warning, so
     * before launch run `npm run images:download` and flip USE_LOCAL_IMAGES in
     * src/lib/content/imagery.ts — at which point this entry can be deleted.
     */
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/aida-public/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
