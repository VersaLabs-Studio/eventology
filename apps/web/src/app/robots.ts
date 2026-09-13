import type { MetadataRoute } from 'next';

/**
 * Robots (HO-K) — App Router file convention. Points crawlers at the
 * sitemap and keeps them out of auth, API, and role-scoped areas.
 */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://eventology.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/admin/', '/org/', '/settings/', '/my-events/', '/profile'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
