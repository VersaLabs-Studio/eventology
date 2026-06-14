"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { EventAnalyticsAI } from "@/components/ai/event-analytics-ai";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useEventAnalytics } from "@/hooks/use-event-analytics";

export default function AnalyticsPage() {
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

  const analyticsQ = useEventAnalytics(meQ.data?.organizerId ?? null, eventId);

  const analytics = analyticsQ.data;
  const chartsData = analytics
    ? {
        registrationsOverTime: analytics.registrationsOverTime,
        viewsOverTime: analytics.viewsOverTime,
        tierDistribution: analytics.tierDistribution,
        subCityDistribution: analytics.subCityDistribution,
      }
    : null;

  if (analyticsQ.isLoading || meQ.isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Loading analytics…" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </motion.div>
    );
  }

  if (analyticsQ.isError || !analytics) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Analytics" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Failed to load analytics. Make sure you own this event.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Analytics" description={`${analytics.totalRegistrations} registrations · ${analytics.totalViews} views`} />
      <div className="flex gap-2 mb-6">
        {["Last 7 Days", "Last 30 Days", "All Time"].map((range) => (
          <button key={range} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 transition-colors">
            {range}
          </button>
        ))}
      </div>
      {chartsData && <AnalyticsCharts data={chartsData} />}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">Conversion Rate</p>
          <p className="font-semibold text-sm mt-1">{Math.round(analytics.conversionRate * 100)}%</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">Total Registrations</p>
          <p className="font-semibold text-sm mt-1">{analytics.totalRegistrations}</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">Total Views</p>
          <p className="font-semibold text-sm mt-1">{analytics.totalViews}</p>
        </div>
      </div>
      <EventAnalyticsAI eventId={eventId} />
    </motion.div>
  );
}
