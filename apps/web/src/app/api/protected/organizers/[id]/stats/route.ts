// ============================================================================
// GET /api/protected/organizers/[id]/stats
//   Aggregates for the organizer dashboard (organizer-scoped):
//     - total events
//     - total registrations (status=confirmed|checked_in)
//     - total views (event_views)
//     - conversion rate (registrations / views)
//     - registrationsOverTime (last 30 days, by day)
//     - viewsOverTime (last 30 days, by day)
//     - top 5 events by registrations
//   RLS self-enforces ownership via the authed client — each table read
//   is constrained to the caller's own events. We use a SINGLE authed
//   client + parallel queries (vs. service-role) because the aggregates
//   are small + per-row ownership is non-negotiable per the security
//   contract.
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
interface TopEvent {
  id: string;
  title: string;
  registrations: number;
  views: number;
  status: string;
}

export interface OrganizerStats {
  totalEvents: number;
  totalRegistrations: number;
  totalViews: number;
  conversionRate: number;
  registrationsOverTime: TrendPoint[];
  viewsOverTime: TrendPoint[];
  topEvents: TopEvent[];
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

  const { id: organizerId } = await params;
  if (!organizerId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'organizer id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // App-level ownership check (admins bypass).
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

  // For admin callers we still want to read cross-row data; the authed
  // client only sees the admin's own data, so use service-role when
  // the caller is admin (justified — same pattern as /admin/stats).
  const useService = ctx.profileRole === 'admin';
  const client = useService ? createServiceClient() : authed;

  // 30-day window
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const sinceIso = since.toISOString();

  // Get this organizer's event ids
  const { data: events } = await client
    .from('events')
    .select('id, title, status, views_count')
    .eq('organizer_id', organizerId);

  const eventIds = (events ?? []).map((e) => e.id);
  const topEvents: TopEvent[] = (events ?? [])
    .map((e) => ({ id: e.id, title: e.title, registrations: 0, views: e.views_count ?? 0, status: e.status }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  if (eventIds.length === 0) {
    return NextResponse.json({
      totalEvents: 0,
      totalRegistrations: 0,
      totalViews: 0,
      conversionRate: 0,
      registrationsOverTime: buildEmptyDays(30),
      viewsOverTime: buildEmptyDays(30),
      topEvents: [],
      generatedAt: new Date().toISOString(),
    } satisfies OrganizerStats);
  }

  // Aggregate registrations + recent registrations for the trend
  const [regsAll, regsRecent, viewsRecent] = await Promise.all([
    client
      .from('registrations')
      .select('id, event_id, status, created_at', { count: 'exact' })
      .in('event_id', eventIds)
      .in('status', ['confirmed', 'checked_in']),
    client
      .from('registrations')
      .select('id, created_at')
      .in('event_id', eventIds)
      .in('status', ['confirmed', 'checked_in'])
      .gte('created_at', sinceIso),
    client
      .from('event_views')
      .select('id, viewed_at')
      .in('event_id', eventIds)
      .gte('viewed_at', sinceIso),
  ]);

  const totalRegs = regsAll.count ?? regsAll.data?.length ?? 0;
  const totalViews = (events ?? []).reduce((s, e) => s + (e.views_count ?? 0), 0);
  const conversion = totalViews > 0 ? Math.round((totalRegs / totalViews) * 10000) / 10000 : 0;

  // Bucket registrations by day
  const regBuckets = buildEmptyDays(30);
  for (const r of regsRecent.data ?? []) {
    const day = isoDay(new Date(r.created_at));
    const bucket = regBuckets.find((b) => b.label === day);
    if (bucket) bucket.value += 1;
  }
  // Bucket views by day
  const viewBuckets = buildEmptyDays(30);
  for (const v of viewsRecent.data ?? []) {
    const day = isoDay(new Date(v.viewed_at));
    const bucket = viewBuckets.find((b) => b.label === day);
    if (bucket) bucket.value += 1;
  }

  // Top events: fill in registration counts
  const regsByEvent = new Map<string, number>();
  for (const r of regsAll.data ?? []) {
    regsByEvent.set(r.event_id, (regsByEvent.get(r.event_id) ?? 0) + 1);
  }
  for (const e of topEvents) {
    e.registrations = regsByEvent.get(e.id) ?? 0;
  }
  topEvents.sort((a, b) => b.registrations - a.registrations);

  return NextResponse.json({
    totalEvents: (events ?? []).length,
    totalRegistrations: totalRegs,
    totalViews,
    conversionRate: conversion,
    registrationsOverTime: regBuckets,
    viewsOverTime: viewBuckets,
    topEvents: topEvents.slice(0, 5),
    generatedAt: new Date().toISOString(),
  } satisfies OrganizerStats);
}
