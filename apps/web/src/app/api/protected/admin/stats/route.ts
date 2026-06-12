// ============================================================================
// GET /api/protected/admin/stats
// ADMIN-002 — Platform-wide aggregates for the admin dashboard.
// Service-role justified: aggregate queries span 4+ tables and
// cross-role visibility (e.g. revenue across all organizers); a
// single authed SELECT with RLS would be correct but slower + messier
// than one pass per aggregate via the bypass client.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute } from '@/lib/api/admin-guard';
import type { ErrorEnvelope } from '@/lib/api';

interface CategorySlice {
  label: string;
  value: number;
}

export interface PlatformStats {
  // Top cards
  totalEvents: number;
  totalRegistrations: number;
  activeUsers: number;
  totalOrganizers: number;
  totalRevenue: number;
  currency: string;
  // Growth — registrations this month vs last month, %
  growthRate: number;
  // Registrations / unique visitors proxy
  conversionRate: number;
  // Charts
  monthlyGrowth: { label: string; value: number }[];
  categoryDistribution: CategorySlice[];
  subCityDistribution: CategorySlice[];
  dailyActiveUsers: { label: string; value: number }[];
  // Metadata
  generatedAt: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short' });
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service } = guard;

  // Run all aggregates in parallel — they're independent.
  const [
    totalEventsRes,
    totalRegsRes,
    activeUsersRes,
    totalOrganizersRes,
    completedPaymentsRes,
    regsThisMonthRes,
    regsLastMonthRes,
    regsLast30DaysRes,
    eventsByCategoryRes,
    eventsBySubCityRes,
    dailyViewsRes,
  ] = await Promise.all([
    service.from('events').select('id', { count: 'exact', head: true }),
    service.from('registrations').select('id', { count: 'exact', head: true }),
    service.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    service.from('organizers').select('id', { count: 'exact', head: true }),
    service.from('payments')
      .select('amount, currency')
      .eq('status', 'completed'),
    service.from('registrations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonthISO()),
    service.from('registrations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfLastMonthISO())
      .lt('created_at', startOfMonthISO()),
    service.from('registrations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', daysAgoISO(30)),
    // Category distribution: join events -> categories
    service.from('events').select('category_id, categories(name)'),
    service.from('events').select('sub_city').not('sub_city', 'is', null),
    // Daily active users proxy = distinct event_views per day
    service.from('event_views')
      .select('viewed_at')
      .gte('viewed_at', daysAgoISO(30)),
  ]);

  // 1. Top cards
  const totalEvents = totalEventsRes.count ?? 0;
  const totalRegistrations = totalRegsRes.count ?? 0;
  const activeUsers = activeUsersRes.count ?? 0;
  const totalOrganizers = totalOrganizersRes.count ?? 0;

  let totalRevenue = 0;
  let currency = 'ETB';
  for (const p of completedPaymentsRes.data ?? []) {
    totalRevenue += Number(p.amount ?? 0);
    if (p.currency) currency = p.currency as string;
  }
  totalRevenue = round2(totalRevenue);

  // 2. Growth rate: this month vs last month (registrations)
  const thisMonth = regsThisMonthRes.count ?? 0;
  const lastMonth = regsLastMonthRes.count ?? 0;
  const growthRate = lastMonth === 0
    ? (thisMonth > 0 ? 100 : 0)
    : round2(((thisMonth - lastMonth) / lastMonth) * 100);

  // 3. Conversion rate: last-30d registrations / last-30d event views
  // (no separate visits table — use event_views as the closest proxy)
  const last30Regs = regsLast30DaysRes.count ?? 0;
  const last30Views = (dailyViewsRes.data ?? []).length;
  const conversionRate = last30Views === 0
    ? 0
    : round2((last30Regs / last30Views) * 100);

  // 4. Monthly growth (last 5 calendar months — events created per month)
  const monthlyGrowth = await computeMonthlyEvents(service);

  // 5. Category distribution
  const catMap = new Map<string, number>();
  for (const row of (eventsByCategoryRes.data ?? []) as Array<{ categories: { name: string } | { name: string }[] | null }>) {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    const name = cat?.name ?? 'Uncategorized';
    catMap.set(name, (catMap.get(name) ?? 0) + 1);
  }
  const categoryDistribution: CategorySlice[] = [...catMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // 6. Sub-city distribution (events)
  const scMap = new Map<string, number>();
  for (const row of (eventsBySubCityRes.data ?? []) as Array<{ sub_city: string | null }>) {
    const key = row.sub_city ?? 'Unknown';
    scMap.set(key, (scMap.get(key) ?? 0) + 1);
  }
  const subCityDistribution: CategorySlice[] = [...scMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // 7. Daily active users (event_views bucketed per day, last 7)
  const dailyActiveUsers = computeDailyActiveUsers(dailyViewsRes.data ?? []);

  const stats: PlatformStats = {
    totalEvents,
    totalRegistrations,
    activeUsers,
    totalOrganizers,
    totalRevenue,
    currency,
    growthRate,
    conversionRate,
    monthlyGrowth,
    categoryDistribution,
    subCityDistribution,
    dailyActiveUsers,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(stats);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function startOfLastMonthISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString();
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function computeMonthlyEvents(
  service: ReturnType<typeof import('@/lib/supabase/server').createServiceClient>
): Promise<{ label: string; value: number }[]> {
  // 5 calendar months back → now
  const now = new Date();
  const months: { label: string; start: string; end: string }[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const start = d.toISOString();
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString();
    months.push({ label: monthLabel(d), start, end });
  }

  const counts = await Promise.all(
    months.map((m) =>
      service
        .from('events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', m.start)
        .lt('created_at', m.end)
        .then((r) => r.count ?? 0)
    )
  );

  return months.map((m, i) => ({ label: m.label, value: counts[i] }));
}

function computeDailyActiveUsers(
  rows: Array<{ viewed_at: string }>
): { label: string; value: number }[] {
  // Bucket by day for last 7 days
  const buckets = new Map<string, Set<string>>();
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = isoDay(d);
    buckets.set(key, new Set());
  }

  for (const row of rows) {
    const day = isoDay(new Date(row.viewed_at));
    if (buckets.has(day)) {
      buckets.get(day)!.add(row.viewed_at);
    }
  }

  return [...buckets.entries()].map(([day, set]) => {
    const d = new Date(day);
    return { label: `D-${Math.round((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))}`, value: set.size };
  });
}
