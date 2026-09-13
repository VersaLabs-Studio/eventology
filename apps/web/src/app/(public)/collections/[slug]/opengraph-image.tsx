import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

// HO-K: sibling OG for the shareable collection page — structure copied
// from (public)/events/[slug]/opengraph-image.tsx (do-not-rebuild rule
// applies to the EVENT OG only; this is a NEW surface).

export const alt = 'Collection on Eventology';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function getCollection(slug: string) {
  const supabase = await createClient();
  // RLS scopes anon reads to public/unlisted — private lists render the fallback.
  const { data } = await supabase
    .from('collections')
    .select('title, description, cover_url, owner:profiles!collections_owner_id_fkey(full_name)')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollection(slug);

  const title = collection?.title ?? 'Collection';
  const description = collection?.description ?? '';
  const ownerName = (collection?.owner as { full_name?: string } | null)?.full_name ?? '';

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

        {/* Collection badge */}
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
          Collection
        </div>

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

        {/* Footer */}
        {ownerName && (
          <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '20px' }}>
            <span style={{ marginRight: '12px' }}>📋</span>
            curated by {ownerName}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
