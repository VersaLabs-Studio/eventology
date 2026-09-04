import { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient, createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { EventCard } from "@/components/shared/event-card";
import { transformEvent } from '@/lib/transformers';
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * /collections/[slug] — shareable collection view (HO-C).
 * Server component; the cookie-based client resolves the optional session so
 * owners can open their own private lists' share URLs. Everyone else 404s on
 * private lists (RLS `col_select_visible`). Editorial lists render an
 * "Editorial" badge. (Rich OG images arrive with HO-K; basic OG ships now.)
 */

async function getCollection(slug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const supabase = session ? await createAuthedClient(session.user.id) : await createClient();

  const { data: collection } = await supabase
    .from('collections')
    .select('*, owner:profiles!collections_owner_id_fkey(full_name, avatar_url)')
    .eq('slug', slug)
    .maybeSingle();

  if (!collection) return null;

  const { data: items } = await supabase
    .from('collection_items')
    .select(
      `position, event:events(
        *,
        category:categories!inner(id, name, slug, icon, color),
        organizer:organizers(id, name, slug, avatar_url, is_verified),
        ticket_tiers(id, name, price, currency, capacity, sold_count)
      )`
    )
    .eq('collection_id', collection.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  const events = (items ?? [])
    .map((row) => (row as { event?: unknown }).event)
    .filter((e): e is NonNullable<typeof e> => e != null);

  return { collection: collection as Record<string, unknown>, events };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollection(slug);

  if (!result) {
    return { title: 'Collection Not Found | Eventology' };
  }

  const c = result.collection as { title: string; description: string | null };
  const title = `${c.title} | Eventology`;
  const description = c.description || 'A curated collection of events on Eventology.';
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://eventology.app'}/collections/${slug}`;

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
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const result = await getCollection(slug);
  if (!result) notFound();

  const c = result.collection as {
    title: string;
    description: string | null;
    cover_url: string | null;
    is_editorial: boolean;
    owner?: { full_name: string } | null;
  };

  const events = result.events.map((e) => transformEvent(e as Parameters<typeof transformEvent>[0]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-border/60 mb-8">
        <div className="relative h-48 sm:h-64 bg-muted">
          {c.cover_url ? (
            <Image
              src={c.cover_url}
              alt={c.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {c.is_editorial && (
              <Badge variant="accent" className="text-[10px] uppercase font-extrabold">
                Editorial
              </Badge>
            )}
            {c.owner?.full_name && (
              <span className="text-xs text-muted-foreground">
                Curated by {c.owner.full_name}
              </span>
            )}
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">{c.title}</h1>
          {c.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{c.description}</p>
          )}
          <p className="text-xs font-bold text-muted-foreground mt-2 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </p>
        </div>
      </div>

      {/* Ordered event grid */}
      {events.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-muted/30 border border-border/40">
          <p className="text-sm text-muted-foreground">No events in this collection yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/events" className="text-sm font-bold text-primary hover:underline">
          Browse more events →
        </Link>
      </div>
    </div>
  );
}
