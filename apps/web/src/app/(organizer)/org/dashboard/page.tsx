"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FallbackImage } from "@/components/shared/fallback-image";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Eye, TrendingUp, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { AreaChartComponent, BarChartComponent } from "@/components/ui/chart";
import { useOrganizerStats } from "@/hooks/use-organizer-stats";
import { useMyOrganizerEvents } from "@/hooks/use-my-organizer-events";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

interface MeOrganizer {
  organizerId: string | null;
  name: string | null;
  isVerified: boolean;
}

/**
 * R2: Org dashboard now hits /api/protected/organizers/[id]/stats
 * (the organizer's own stats endpoint). RLS + app-level ownership
 * enforced on the server. We resolve the caller's organizer id via
 * a tiny /api/protected/organizers/me endpoint (added in R2).
 */
export default function OrgDashboardPage() {
  const { user } = useAuth();
  const meQ = useQuery<MeOrganizer>({
    queryKey: ['organizer-me'],
    queryFn: async () => {
      const res = await fetch('/api/protected/organizers/me');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to load');
      }
      return res.json();
    },
  });

  const organizerId = meQ.data?.organizerId ?? null;
  const statsQ = useOrganizerStats(organizerId);
  const eventsQ = useMyOrganizerEvents({ limit: 5 });

  const stats = statsQ.data;
  const events = eventsQ.data?.data ?? [];

  const isLoading = meQ.isLoading || statsQ.isLoading || eventsQ.isLoading;
  const isError = meQ.isError || (statsQ.isError && eventsQ.isError);

  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Organizer Dashboard" description="Welcome to your dashboard" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Failed to load your organizer dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">
              You may not have an organizer profile yet, or there was a server error.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // No organizer yet — show CTA to become an organizer
  if (!isLoading && !meQ.data?.organizerId) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Organizer Dashboard"
          description="Become an organizer to publish events."
        />
        <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card">
          <Sparkles className="h-10 w-10 text-accent mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg mb-1">No organizer profile yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Create an organizer profile to start publishing events, managing registrations, and earning revenue.
          </p>
          <Link href="/org/events/create">
            <Button variant="accent">Create your first event</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Organizer Dashboard"
        description={user ? `Welcome back, ${(user as { name?: string }).name ?? meQ.data?.name ?? 'Organizer'}` : 'Welcome to your dashboard'}
        action={
          <Link href="/org/events/create">
            <Button variant="accent">Create Event</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Events" value={stats?.totalEvents ?? 0} icon={Calendar} variant="org" />
            <StatCard title="Total Registrations" value={stats?.totalRegistrations ?? 0} icon={Users} variant="org" />
            <StatCard title="Total Views" value={stats?.totalViews ?? 0} icon={Eye} variant="org" />
            <StatCard
              title="Conversion Rate"
              value={`${Math.round((stats?.conversionRate ?? 0) * 100)}%`}
              icon={TrendingUp}
              variant="org"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-sm">Registrations (last 30 days)</h3>
                <Badge variant="outline" className="text-[10px]">Live</Badge>
              </div>
              {stats && stats.registrationsOverTime.length > 0 ? (
                <AreaChartComponent data={stats.registrationsOverTime} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No registrations yet
                </p>
              )}
            </div>
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-sm">Views (last 30 days)</h3>
                <Badge variant="outline" className="text-[10px]">Live</Badge>
              </div>
              {stats && stats.viewsOverTime.length > 0 ? (
                <BarChartComponent data={stats.viewsOverTime} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No views yet
                </p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm">Recent Events</h3>
              <Link href="/org/events">
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">No events yet — create your first one.</p>
                <Link href="/org/events/create">
                  <Button size="sm" variant="accent">Create Event</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map((e) => (
                  <Link
                    key={e.id}
                    href={`/org/events/${e.id}`}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-card border border-border/60 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <FallbackImage
                      src={e.banner_image ?? ""}
                      alt={e.title}
                      aspectRatio="square"
                      className="h-12 w-12 shrink-0 rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.start_date)} · {e.registrations_count} registrations · {e.views_count} views
                      </p>
                    </div>
                    <Badge variant={
                      e.status === 'approved' ? 'success' :
                      e.status === 'rejected' ? 'destructive' :
                      e.status === 'pending' ? 'outline' :
                      'default'
                    }>
                      {e.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-border/60 shadow-sm p-5 mt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-accent mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display font-semibold text-sm">Pro tip</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Add sponsors to your events to boost visibility. Use the Messaging panel on each
                  event page to broadcast announcements to confirmed attendees.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
