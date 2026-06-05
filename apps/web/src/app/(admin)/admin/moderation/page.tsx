"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ModerationCard } from "@/components/admin/moderation-card";
import { useEvents, useUpdateEvent } from "@/hooks/use-events";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function ModerationPage() {
  const [tab, setTab] = React.useState("pending");

  const { data: pendingData, isLoading: pendingLoading } = useEvents({ limit: 50, status: "pending" });
  const { data: approvedData, isLoading: approvedLoading } = useEvents({ limit: 50, status: "approved" });
  const { data: rejectedData, isLoading: rejectedLoading } = useEvents({ limit: 50, status: "rejected" });

  const pending = pendingData?.data ?? [];
  const approved = approvedData?.data ?? [];
  const rejected = rejectedData?.data ?? [];

  const updateEvent = useUpdateEvent();

  const handleApprove = (id: string) => {
    updateEvent.mutate(
      { id, data: { status: "approved" } },
      {
        onSuccess: () => toast.success("Event approved and published."),
        onError: () => toast.error("Failed to approve event."),
      }
    );
  };

  const handleReject = (id: string) => {
    updateEvent.mutate(
      { id, data: { status: "rejected" } },
      {
        onSuccess: () => toast("Event rejected. The organizer has been notified."),
        onError: () => toast.error("Failed to reject event."),
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Event Moderation"
        description={
          <span>{pending.length} events pending review <Badge variant="accent">{pending.length}</Badge></span>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          )}
          {!pendingLoading && pending.length === 0 && (
            <EmptyState icon={ShieldCheck} title="No pending events" description="All events have been reviewed." />
          )}
          {!pendingLoading && pending.map((event) => (
            <ModerationCard
              key={event.id}
              event={event}
              onApprove={() => handleApprove(event.id)}
              onReject={() => handleReject(event.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="approved" className="mt-6 space-y-4">
          {approvedLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!approvedLoading && approved.map((event) => (
            <div key={event.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
              <span className="text-sm">{event.title}</span>
              <Badge variant="success">Approved</Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6 space-y-4">
          {rejectedLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!rejectedLoading && rejected.map((event) => (
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
