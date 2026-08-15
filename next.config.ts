import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    /**
     * All brand photography is now served from /public/images
     * (see src/lib/content/imagery.ts, USE_LOCAL_IMAGES = true), so no remote
     * pattern is required. Re-add lh3.googleusercontent.com only if you switch
     * back to the Stitch-hosted originals.
     */
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
