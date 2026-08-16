import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    /**
     * All brand photography is served from /public/images (see
     * src/lib/content/imagery.ts, USE_LOCAL_IMAGES = true) — no remote pattern
     * needed for that. lh3.googleusercontent.com is different: it's a Google
     * *account* avatar URL, genuinely external and per-user, read from
     * user_metadata.avatar_url after Google sign-in (src/lib/auth/session.ts).
     */
    remotePatterns: [{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
