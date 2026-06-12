"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { EventAnalyticsAI } from "@/components/ai/event-analytics-ai";
import { getEventById } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export default function AnalyticsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = getEventById(eventId);

  if (!event) notFound();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title={`Analytics for ${event.title}`} />
      <div className="flex gap-2 mb-6">
        {["Last 7 Days", "Last 30 Days", "All Time"].map((range) => (
          <button key={range} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 transition-colors">
            {range}
          </button>
        ))}
      </div>
      <AnalyticsCharts />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">Peak Registration Day</p>
          <p className="font-semibold text-sm mt-1">May 26, 2026</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">Most Popular Tier</p>
          <p className="font-semibold text-sm mt-1">General Admission</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground">Top Referral Source</p>
          <p className="font-semibold text-sm mt-1">Social Media</p>
        </div>
      </div>
      <EventAnalyticsAI eventId={eventId} />
    </motion.div>
  );
}
