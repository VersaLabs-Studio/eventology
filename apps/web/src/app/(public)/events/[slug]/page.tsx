import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import EventDetailClient from './event-detail-client';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('title, short_description, banner_image')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  return data;
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
  const ogImageUrl = `${url}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Eventology',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
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

  return <EventDetailClient slug={slug} />;
}
