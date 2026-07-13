import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * GET /api/public/events/nearby?lat=X&lng=Y&radius=10&limit=12
 *
 * Proximity discovery (Part 2 §3.12). Calls the events_nearby PostGIS RPC
 * (migration 034) to get approved, upcoming events within `radius` km ordered
 * by distance, then resolves those ids to full event cards (same shape as
 * /api/public/events) and attaches `distance_m` to each. `radius` is in km
 * (1–50, default 10).
 */

const SELECT_FIELDS = `
  *,
  category:categories(id, name, slug, icon, color),
  organizer:organizers(id, name, slug, avatar_url, is_verified),
  ticket_tiers(id, name, price, currency, capacity, sold_count)
`;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const radiusKm = Math.min(50, Math.max(1, Number(searchParams.get('radius') ?? 10)));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));

  if (
    !Number.isFinite(lat) || !Number.isFinite(lng) ||
    lat < -90 || lat > 90 || lng < -180 || lng > 180
  ) {
    return NextResponse.json(
      { error: { code: 'INVALID_COORDS', message: 'Valid lat and lng query params are required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { data: near, error: rpcError } = await supabase.rpc('events_nearby', {
    p_lat: lat,
    p_lng: lng,
    p_radius_m: radiusKm * 1000,
    p_limit: limit,
  });

  if (rpcError) {
    console.error('[public/events/nearby] RPC error:', rpcError.message);
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: rpcError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows = (near ?? []) as { id: string; distance_m: number }[];
  if (rows.length === 0) {
    return NextResponse.json(
      { data: [], meta: { total: 0, page: 1, limit } } satisfies ListEnvelope<unknown>
    );
  }

  const distanceById = new Map(rows.map((r) => [r.id, r.distance_m]));
  const ids = rows.map((r) => r.id);

  const { data: events, error } = await supabase.from('events').select(SELECT_FIELDS).in('id', ids);

  if (error) {
    console.error('[public/events/nearby] events error:', error.message);
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Re-attach distance and preserve the RPC's nearest-first ordering (the
  // `.in()` fetch does not guarantee order).
  const withDistance = ((events ?? []) as Record<string, unknown>[])
    .map((e) => ({ ...e, distance_m: distanceById.get(e.id as string) ?? null }))
    .sort(
      (a, b) =>
        ((a.distance_m as number | null) ?? Number.POSITIVE_INFINITY) -
        ((b.distance_m as number | null) ?? Number.POSITIVE_INFINITY)
    );

  return NextResponse.json(
    { data: withDistance, meta: { total: withDistance.length, page: 1, limit } } satisfies ListEnvelope<unknown>
  );
}
