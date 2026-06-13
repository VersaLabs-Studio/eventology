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
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { Calendar, Eye, TrendingUp, Percent, Edit3, Copy, ExternalLink, Megaphone } from "lucide-react";
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

  // Load the event from the public detail (the row is joined with
  // category+organizer+tiers). For an org view, RLS self-enforces
  // ownership on the protected event-by-id route. Use that for richer
  // fields (rejection_reason, etc.).
  const eventQ = useQuery<OrganizerEvent>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/public/events/${eventId}`);
      if (!res.ok) {
        // Public endpoint filters to status=approved; for non-approved
        // events the org can still see them via the protected route.
        // Fall back to that.
        const r2 = await fetch(`/api/protected/events/${eventId}`);
        if (!r2.ok) throw new Error('Event not found');
        return r2.json();
      }
      return res.json();
    },
  });

  const event = eventQ.data;

  if (eventQ.isLoading || meQ.isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Loading…" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title={event.title}
        description={event.short_description ?? undefined}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={
              event.status === 'approved' ? 'success' :
              event.status === 'rejected' ? 'destructive' :
              event.status === 'pending' ? 'outline' :
              'default'
            }>
              {event.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`);
                toast.success('Public link copied');
              }}
            >
              <ExternalLink className="mr-1 h-4 w-4" /> Share
            </Button>
            <Button variant="outline" size="sm">
              <Edit3 className="mr-1 h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="mr-1 h-4 w-4" /> Duplicate
            </Button>
          </div>
        }
      />

      {event.rejection_reason && event.status === 'rejected' && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
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
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Views" value={event.views_count} icon={Eye} />
            <StatCard title="Registrations" value={event.registrations_count} icon={Calendar} />
            <StatCard title="Capacity" value={`${capacityPercent}%`} icon={TrendingUp} />
            <StatCard title="Conversion" value={`${conversion}%`} icon={Percent} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
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

        <TabsContent value="registrations">
          <Link href={`/org/events/${event.id}/registrations`}>
            <Button variant="accent">View All Registrations</Button>
          </Link>
        </TabsContent>

        <TabsContent value="analytics">
          <Link href={`/org/events/${event.id}/analytics`}>
            <Button variant="accent">View Analytics</Button>
          </Link>
        </TabsContent>

        <TabsContent value="check-in">
          <Link href={`/org/events/${event.id}/check-in`}>
            <Button variant="accent">Open Check-In</Button>
          </Link>
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
