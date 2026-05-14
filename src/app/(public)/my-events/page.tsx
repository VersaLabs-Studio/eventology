"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EventCard } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { events } from "@/lib/mock-data";
import { CalendarDays } from "lucide-react";

export default function MyEventsPage() {
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now).slice(0, 5);
  const past = events.filter((e) => new Date(e.date) < now).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="My Events" description="Your upcoming and past events" />

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6">
            {upcoming.length > 0 ? (
              <div className="space-y-4">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} variant="horizontal" />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events"
                description="Discover events to get started"
                action={{ label: "Browse Events", onClick: () => window.location.href = "/events" }}
              />
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            {past.length > 0 ? (
              <div className="space-y-4 opacity-60">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} variant="horizontal" />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No past events"
                description="Your attended events will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
