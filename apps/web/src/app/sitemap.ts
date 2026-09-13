import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

/**
 * Sitemap (HO-K) — approved public events, categories, and public
 * collections. App Router file convention (LOCKED: not a hand-written XML
 * route). Revalidated at request time; the event list is capped at 5000
 * entries (Google's per-sitemap comfort zone is 50k — this keeps payloads
 * light for an MVP-scale catalog).
 */
export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://eventology.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/events`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/discover`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/categories`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/search`, changeFrequency: 'weekly', priority: 0.4 },
  ];

  try {
    const [events, categories, collections] = await Promise.all([
      supabase
        .from('events')
        .select('slug, updated_at')
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(5000),
      supabase.from('categories').select('slug').eq('is_active', true),
      supabase.from('collections').select('slug, updated_at').eq('visibility', 'public').limit(1000),
    ]);

    const eventEntries: MetadataRoute.Sitemap = (events.data ?? []).map((e) => ({
      url: `${BASE_URL}/events/${e.slug}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : undefined,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = (categories.data ?? []).map((c) => ({
      url: `${BASE_URL}/categories/${c.slug}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    const collectionEntries: MetadataRoute.Sitemap = (collections.data ?? []).map((c) => ({
      url: `${BASE_URL}/collections/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    return [...staticRoutes, ...eventEntries, ...categoryEntries, ...collectionEntries];
  } catch {
    // A DB hiccup must not 500 the sitemap — serve statics only.
    return staticRoutes;
  }
}
