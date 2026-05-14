"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ModerationCard } from "@/components/admin/moderation-card";
import { events } from "@/lib/mock-data";
import { toast } from "sonner";

export default function ModerationPage() {
  const pending = events.filter((e) => e.status === "pending");
  const approved = events.filter((e) => e.status === "approved");
  const rejected = events.filter((e) => e.status === "rejected");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Event Moderation"
        description={
          <span>{pending.length} events pending review <Badge variant="accent">{pending.length}</Badge></span>
        }
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6 space-y-4">
          {pending.map((event) => (
            <ModerationCard
              key={event.id}
              event={event}
              onApprove={() => toast.success("Event approved and published.")}
              onReject={() => toast("Event rejected. The organizer has been notified.")}
            />
          ))}
        </TabsContent>
        <TabsContent value="approved" className="mt-6 space-y-4">
          {approved.map((event) => (
            <div key={event.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
              <span className="text-sm">{event.title}</span>
              <Badge variant="success">Approved</Badge>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="rejected" className="mt-6 space-y-4">
          {rejected.map((event) => (
            <div key={event.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
              <span className="text-sm">{event.title}</span>
              <Badge variant="destructive">Rejected</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
