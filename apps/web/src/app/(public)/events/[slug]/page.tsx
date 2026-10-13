import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import EventDetailClient from './event-detail-client';
import { notFound } from 'next/navigation';
import { buildEventJsonLd, type JsonLdEventSource } from '@/lib/seo/event-jsonld';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select(`
      id,
      title,
      short_description,
      banner_image,
      slug,
      description,
      start_date,
      end_date,
      location_type,
      venue_name,
      venue_address,
      sub_city,
      ticket_tiers(name, price, currency),
      organizer:organizers(name)
    `)
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  return data;
}

/**
 * HO-M: the live window is computed SERVER-SIDE (LOCKED) and passed down —
 * the client never decides what "happening now" means. Evaluated at
 * request time (page is dynamic).
 */
function isHappeningNow(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return {
      title: 'Event Not Found | Eventology',
    };
  }

  const title = `${event.title} | Eventology`;
  const description = event.short_description || 'Join us for this exciting event on Eventology.';
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://eventology.app'}/events/${slug}`;

  // No `images` here: the sibling opengraph-image.tsx / twitter-image.tsx
  // inject their own tags. Inside a route group Next serves them at a
  // build-hashed path (/opengraph-image-<hash>), so a hand-built
  // `${url}/opengraph-image` URL 404s and breaks every share preview.

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Eventology',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  // Verify event exists to throw 404 early on server side
  const event = await getEvent(slug);
  if (!event) {
    notFound();
  }

  // HO-K: schema.org Event JSON-LD for search engines. The event row here is
  // the anon-readable projection (sanitizer not needed: online_url is not
  // selected — and buildEventJsonLd would never emit it anyway).
  const jsonLd = buildEventJsonLd(event as JsonLdEventSource);

  // HO-M: the live window is computed SERVER-SIDE (LOCKED) and passed down —
  // the client never decides what "happening now" means. Evaluated at
  // request time (page is dynamic).
  const live = isHappeningNow(event.start_date ?? null, event.end_date ?? null);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventDetailClient slug={slug} liveWindow={live} eventId={event.id} />
    </>
  );
}
