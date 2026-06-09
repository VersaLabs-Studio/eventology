import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

// Image metadata
export const alt = 'Event on Eventology';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Fetch event data server-side
async function getEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('title, short_description, start_date, end_date, venue_name, venue_address, banner_image, category:categories(name, color), organizer:organizers(name)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();
  return data;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);

  const title = event?.title ?? 'Event';
  const description = event?.short_description ?? '';
  const venue = event?.venue_name ?? 'Venue TBA';
  const date = event?.start_date
    ? new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const categoryName = (event?.category as { name?: string })?.name ?? '';
  const organizerName = (event?.organizer as { name?: string })?.name ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          padding: '60px',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Eventology branding */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            E
          </div>
          <div style={{ marginLeft: '16px', fontSize: '28px', fontWeight: '600' }}>Eventology</div>
        </div>

        {/* Category badge */}
        {categoryName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '9999px',
              padding: '8px 20px',
              fontSize: '20px',
              fontWeight: '500',
              alignSelf: 'flex-start',
              marginBottom: '24px',
            }}
          >
            {categoryName}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 40 ? '52px' : '64px',
            fontWeight: 'bold',
            lineHeight: 1.1,
            marginBottom: '24px',
            display: 'flex',
          }}
        >
          {title}
        </div>

        {/* Description */}
        {description && (
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.4,
              marginBottom: 'auto',
              display: 'flex',
              maxWidth: '900px',
            }}
          >
            {description.length > 140 ? description.slice(0, 137) + '…' : description}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer: date + venue + organizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '24px' }}>
          {date && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.9)' }}>
              <span style={{ marginRight: '12px' }}>📅</span>
              {date}
            </div>
          )}
          {venue && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.9)' }}>
              <span style={{ marginRight: '12px' }}>📍</span>
              {venue}
            </div>
          )}
          {organizerName && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '20px' }}>
              <span style={{ marginRight: '12px' }}>🎤</span>
              by {organizerName}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
