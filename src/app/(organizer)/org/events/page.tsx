"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { events, organizers } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

const mockOrganizer = organizers[0];

const statusColors: Record<string, "success" | "warning" | "default" | "destructive"> = {
  approved: "success", draft: "warning", pending: "default", rejected: "destructive",
};

export default function OrgEventsPage() {
  const [tab, setTab] = React.useState("all");
  const orgEvents = events.filter((e) => e.organizer.id === mockOrganizer.id);
  const filtered = tab === "all" ? orgEvents : orgEvents.filter((e) => e.status === tab);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="My Events"
        action={
          <Link href="/org/events/create">
            <Button variant="accent"><Plus className="mr-2 h-4 w-4" /> Create Event</Button>
          </Link>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="approved">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-6">
          <div className="space-y-3">
            {filtered.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                  <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/org/events/${event.id}`} className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(event.date)}</span>
                    <span>{event.registrations} registrations</span>
                    <span>{event.views} views</span>
                  </div>
                </div>
                <Badge variant={statusColors[event.status] || "default"}>{event.status}</Badge>
                <button className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
