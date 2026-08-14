import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Application surface, not content. Also keeps crawlers out of paths that
      // would otherwise burn crawl budget on redirects to /login.
      disallow: ['/admin', '/dashboard', '/api/', '/book/confirm', '/login', '/auth/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
