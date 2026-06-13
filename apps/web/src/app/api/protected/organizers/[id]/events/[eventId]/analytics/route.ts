// ============================================================================
// GET /api/protected/organizers/[id]/events/[eventId]/analytics
//   Per-event analytics for the organizer view. The event must be owned
//   by the given organizer. Aggregates:
//     - registrations by day (last 30d)
//     - views by day (last 30d)
//     - tier distribution (donut)
//     - sub-city distribution (bar)
//     - top sources (best-effort from event_views metadata)
//
// Uses the authed client when the caller owns the event; service-role
// when an admin is reading. RLS self-enforces on the authed-client
// path; the service-role path requires the explicit ownership check
// above.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { getCallerContext } from '@/lib/ai/role-guard';
import type { ErrorEnvelope } from '@/lib/api';

interface TrendPoint {
  label: string;
  value: number;
}

export interface EventAnalytics {
  eventId: string;
  totalRegistrations: number;
  totalViews: number;
  conversionRate: number;
  registrationsOverTime: TrendPoint[];
  viewsOverTime: TrendPoint[];
  tierDistribution: { label: string; value: number }[];
  subCityDistribution: { label: string; value: number }[];
  generatedAt: string;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildEmptyDays(days: number): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    out.push({ label: isoDay(d), value: 0 });
  }
  return out;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id: organizerId, eventId } = await params;
  if (!organizerId || !eventId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'organizer id + event id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const authed = await createAuthedClient(session.user.id);
  const ctx = await getCallerContext(authed, session.user);
  if (!ctx.ok) {
    return NextResponse.json(
      { error: { code: ctx.reason ?? 'FORBIDDEN', message: 'Not authorized' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }
  if (ctx.profileRole !== 'admin') {
    const { data: org } = await authed
      .from('organizers')
      .select('id')
      .eq('id', organizerId)
      .eq('profile_id', session.user.id)
      .maybeSingle();
    if (!org) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not the owner of this organizer' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
  }

  const useService = ctx.profileRole === 'admin';
  const client = useService ? createServiceClient() : authed;

  const { data: event, error: eventErr } = await client
    .from('events')
    .select('id, title, status, views_count, organizer_id')
    .eq('id', eventId)
    .maybeSingle();

  if (eventErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: eventErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!event) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found or not authorized' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }
  if (event.organizer_id !== organizerId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Event does not belong to this organizer' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const sinceIso = since.toISOString();

  const [regsRecent, viewsRecent, regsByTier, regsByCity] = await Promise.all([
    client
      .from('registrations')
      .select('id, created_at, ticket_tier_id')
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'checked_in'])
      .gte('created_at', sinceIso),
    client
      .from('event_views')
      .select('id, viewed_at')
      .eq('event_id', eventId)
      .gte('viewed_at', sinceIso),
    client
      .from('registrations')
      .select('id, ticket_tier_id, ticket_tier:ticket_tiers(name)')
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'checked_in']),
    client
      .from('registrations')
      .select('id, event:events(sub_city)')
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'checked_in']),
  ]);

  // Day buckets
  const regBuckets = buildEmptyDays(30);
  for (const r of regsRecent.data ?? []) {
    const day = isoDay(new Date(r.created_at));
    const bucket = regBuckets.find((b) => b.label === day);
    if (bucket) bucket.value += 1;
  }
  const viewBuckets = buildEmptyDays(30);
  for (const v of viewsRecent.data ?? []) {
    const day = isoDay(new Date(v.viewed_at));
    const bucket = viewBuckets.find((b) => b.label === day);
    if (bucket) bucket.value += 1;
  }

  // Tier distribution
  const tierCounts = new Map<string, number>();
  for (const r of regsByTier.data ?? []) {
    const tier = Array.isArray(r.ticket_tier) ? r.ticket_tier[0] : r.ticket_tier;
    const name = tier?.name ?? 'Unknown';
    tierCounts.set(name, (tierCounts.get(name) ?? 0) + 1);
  }
  const tierDistribution = Array.from(tierCounts.entries()).map(([label, value]) => ({ label, value }));

  // Sub-city distribution
  const cityCounts = new Map<string, number>();
  for (const r of regsByCity.data ?? []) {
    const ev = Array.isArray(r.event) ? r.event[0] : r.event;
    const city = ev?.sub_city ?? 'Unknown';
    cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
  }
  const subCityDistribution = Array.from(cityCounts.entries()).map(([label, value]) => ({ label, value }));

  const totalRegs = (regsByTier.data ?? []).length;
  const totalViews = event.views_count ?? 0;
  const conversion = totalViews > 0 ? Math.round((totalRegs / totalViews) * 10000) / 10000 : 0;

  return NextResponse.json({
    eventId,
    totalRegistrations: totalRegs,
    totalViews,
    conversionRate: conversion,
    registrationsOverTime: regBuckets,
    viewsOverTime: viewBuckets,
    tierDistribution,
    subCityDistribution,
    generatedAt: new Date().toISOString(),
  } satisfies EventAnalytics);
}
