// Twitter card image — same dimensions and content as Open Graph.
// Next.js routes /events/[slug]/twitter-image automatically.
import { createClient } from '@/lib/supabase/server';

export const alt = 'Event on Eventology';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function getEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('title, short_description, start_date, venue_name, category:categories(name), organizer:organizers(name)')
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
  const venue = event?.venue_name ?? '';
  const date = event?.start_date
    ? new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  // Use Edge-compatible inline rendering (no Satori layout helpers beyond flex)
  return new (await import('next/og')).ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          padding: '60px',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', fontSize: '24px', fontWeight: '600' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              marginRight: '12px',
            }}
          >
            E
          </div>
          Eventology
        </div>

        <div style={{ fontSize: title.length > 40 ? '52px' : '64px', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '20px', display: 'flex' }}>
          {title}
        </div>

        {description && (
          <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.8)', marginBottom: 'auto', display: 'flex', maxWidth: '900px' }}>
            {description.length > 130 ? description.slice(0, 127) + '…' : description}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: '32px', fontSize: '22px' }}>
          {date && <span>📅 {date}</span>}
          {venue && <span>📍 {venue}</span>}
        </div>
      </div>
    ),
    { ...size }
  );
}
