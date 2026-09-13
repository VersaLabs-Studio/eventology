import { ImageResponse } from 'next/og';

// HO-K: static OG for the /discover hub — same branded treatment as the
// event OG, no data fetch needed (the hub is a curated surface).

export const alt = 'Discover events on Eventology';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Eventology branding */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            E
          </div>
          <div style={{ marginLeft: '18px', fontSize: '32px', fontWeight: '600' }}>Eventology</div>
        </div>

        <div
          style={{
            fontSize: '84px',
            fontWeight: 'bold',
            lineHeight: 1.1,
            display: 'flex',
          }}
        >
          Discover
        </div>

        <div
          style={{
            fontSize: '28px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '24px',
            display: 'flex',
          }}
        >
          This weekend · Near you · Trending · Curated lists
        </div>
      </div>
    ),
    { ...size }
  );
}
