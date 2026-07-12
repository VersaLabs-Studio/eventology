"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SponsorManager } from "@/components/dashboard/sponsor-manager";
import { TeamManager } from "@/components/dashboard/team-manager";
import { MessagingPanel } from "@/components/dashboard/messaging-panel";
import { RegistrationTable } from "@/components/dashboard/registration-table";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { CheckInScanner } from "@/components/dashboard/check-in-scanner";
import { OrganizerAiPanel } from "@/components/ai/organizer-ai-panel";
import { useQuery } from "@tanstack/react-query";
import { useEventAnalytics } from "@/hooks/use-event-analytics";
import { useEventRegistrations } from "@/hooks/use-registrations";
import { formatDate } from "@/lib/utils";
import { Calendar, Eye, TrendingUp, Percent, ExternalLink, Megaphone, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { toast } from "sonner";

interface OrganizerEvent {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  banner_image: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  start_date: string;
  end_date: string;
  event_type: string;
  ticket_type: 'free' | 'paid';
  venue_name: string | null;
  venue_address: string | null;
  sub_city: string | null;
  capacity: number;
  registrations_count: number;
  views_count: number;
  is_featured: boolean;
  rejection_reason: string | null;
}

const statusVariant: Record<string, "success" | "destructive" | "outline" | "default"> = {
  approved: "success",
  rejected: "destructive",
  pending: "outline",
  draft: "default",
  cancelled: "default",
};

export default function EventManagePage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const meQ = useQuery<{ organizerId: string | null }>({
    queryKey: ['organizer-me'],
    queryFn: async () => {
      const res = await fetch('/api/protected/organizers/me');
      if (!res.ok) throw new Error('Failed to load organizer');
      return res.json();
    },
  });

  const eventQ = useQuery<OrganizerEvent>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/protected/events/${eventId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Event not found'
        );
      }
      return res.json();
    },
  });

  const event = eventQ.data;

  // Inline tab data (fetched once; rendered inside the tabs below).
  const analyticsQ = useEventAnalytics(meQ.data?.organizerId ?? null, eventId);
  const regsQ = useEventRegistrations(eventId);

  if (eventQ.isLoading || meQ.isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Loading…" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </motion.div>
    );
  }

  if (eventQ.isError || !event) {
    notFound();
  }

  const capacityPercent = event.capacity > 0 ? Math.round((event.registrations_count / event.capacity) * 100) : 0;
  const conversion = event.views_count > 0 ? Math.round((event.registrations_count / event.views_count) * 100) : 0;

  const analytics = analyticsQ.data;
  const chartsData = analytics
    ? {
        registrationsOverTime: analytics.registrationsOverTime,
        viewsOverTime: analytics.viewsOverTime,
        tierDistribution: analytics.tierDistribution,
        subCityDistribution: analytics.subCityDistribution,
      }
    : null;

  const registrations = regsQ.data?.data ?? [];
  const checkedIn = registrations.filter((r) => r.status === "checked_in").length;
  const totalAttendees = registrations.filter((r) => r.status === "confirmed" || r.status === "checked_in").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Hero header: banner + title + status + working actions */}
      <div className="relative rounded-2xl overflow-hidden border border-border/60 mb-6 shadow-sm">
        <div className="relative h-44 sm:h-60 w-full bg-muted">
          {event.banner_image ? (
            <Image src={event.banner_image} alt={event.title} fill className="object-cover" sizes="900px" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
              No banner image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Badge variant={statusVariant[event.status] ?? "default"} className="mb-2">
              {event.status}
            </Badge>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white drop-shadow tracking-tight">
              {event.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`);
                toast.success('Public link copied');
              }}
            >
              <ExternalLink className="mr-1 h-4 w-4" /> Share
            </Button>
            <Button asChild variant="accent" size="sm" className="shadow-accent-glow">
              <Link href={`/events/${event.slug}`} className="flex items-center">
                <ExternalLink className="mr-1 h-4 w-4" /> View
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {event.rejection_reason && event.status === 'rejected' && (
        <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Rejection reason</p>
          <p className="text-muted-foreground mt-1">{event.rejection_reason}</p>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="check-in">Check-In</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="messaging">
            <Megaphone className="mr-1 h-3.5 w-3.5" /> Messaging
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Views" value={event.views_count} icon={Eye} />
            <StatCard title="Registrations" value={event.registrations_count} icon={Calendar} />
            <StatCard title="Capacity" value={`${capacityPercent}%`} icon={TrendingUp} />
            <StatCard title="Conversion" value={`${conversion}%`} icon={Percent} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border border-border/60">
              {event.banner_image ? (
                <Image src={event.banner_image} alt={event.title} fill className="object-cover" sizes="600px" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                  No banner
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(event.start_date)}</p>
              </div>
              {event.venue_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{event.venue_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{event.event_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pricing</p>
                <Badge variant={event.ticket_type === 'free' ? 'success' : 'default'}>
                  {event.ticket_type === 'free' ? 'Free' : 'Paid'}
                </Badge>
              </div>
              {event.is_featured && (
                <Badge variant="accent">Featured</Badge>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <OrganizerAiPanel
            eventId={event.id}
            title={event.title}
            eventType={event.event_type}
            description={event.description ?? ""}
            category={event.event_type}
            capacity={event.capacity}
            registrationsCount={event.registrations_count}
            startDate={event.start_date}
            isFeatured={event.is_featured}
          />
        </TabsContent>

        <TabsContent value="registrations" className="mt-6">
          <RegistrationTable eventId={event.id} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {analyticsQ.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : analyticsQ.isError || !analytics ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              Failed to load analytics. Make sure you own this event.
            </div>
          ) : (
            <div>
              <div className="flex gap-2 mb-6">
                {["Last 7 Days", "Last 30 Days", "All Time"].map((range) => (
                  <span key={range} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                    {range}
                  </span>
                ))}
              </div>
              {chartsData && <AnalyticsCharts data={chartsData} />}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-card border border-border/60">
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  <p className="font-semibold text-sm mt-1">{Math.round(analytics.conversionRate * 100)}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/60">
                  <p className="text-xs text-muted-foreground">Total Registrations</p>
                  <p className="font-semibold text-sm mt-1">{analytics.totalRegistrations}</p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/60">
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="font-semibold text-sm mt-1">{analytics.totalViews}</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="check-in" className="mt-6">
          <div className="max-w-lg mx-auto">
            <CheckInScanner eventId={event.id} totalAttendees={totalAttendees} checkedInCount={checkedIn} />
          </div>
        </TabsContent>

        <TabsContent value="sponsors" className="mt-6">
          <PageHeader title="Sponsors" description="Manage sponsors displayed on this event's public page." />
          <SponsorManager eventId={event.id} />
        </TabsContent>

        <TabsContent value="messaging" className="mt-6">
          <PageHeader title="Messaging" description="Broadcast to attendees + manage conversations." />
          <MessagingPanel eventId={event.id} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
