"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ModerationCard } from "@/components/admin/moderation-card";
import { RejectReasonDialog } from "@/components/admin/reject-reason-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertOctagon, ShieldCheck, Activity } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AdminEventRow } from "@/app/api/protected/admin/events/pending/route";

interface EventsResponse {
  data: AdminEventRow[];
  meta: { total: number; page: number; limit: number };
}

interface AIModerationRow {
  id: string;
  content_type: string;
  content_id: string;
  author_id: string | null;
  is_safe: boolean;
  severity: "none" | "low" | "medium" | "high";
  flags: string[];
  suggested_action: "approve" | "review" | "reject";
  reason: string | null;
  status: "pending" | "reviewed" | "dismissed" | "actioned";
  created_at: string;
}

interface AIFraudRow {
  id: string;
  subject_type: string;
  subject_id: string;
  user_id: string | null;
  risk_score: number;
  flags: string[];
  recommended_action: "allow" | "flag" | "block" | "review";
  reason: string | null;
  status: "open" | "reviewed" | "dismissed" | "actioned";
  created_at: string;
}

const EVENTS_KEY = ["admin", "events"] as const;
const AI_MODERATION_KEY = ["admin", "ai", "moderation"] as const;
const AI_FRAUD_KEY = ["admin", "ai", "fraud"] as const;

async function fetchEvents(status: string): Promise<EventsResponse> {
  const params = new URLSearchParams();
  params.set("status", status);
  params.set("limit", "50");
  const res = await fetch(`/api/protected/admin/events/pending?${params}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to load events");
  }
  return (await res.json()) as EventsResponse;
}

async function approveEvent(id: string): Promise<AdminEventRow> {
  const res = await fetch(`/api/protected/admin/events/${id}/approve`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to approve event");
  }
  return res.json();
}

async function rejectEvent(id: string, reason: string): Promise<AdminEventRow> {
  const res = await fetch(`/api/protected/admin/events/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to reject event");
  }
  return res.json();
}

async function fetchAIModeration(): Promise<{ data: AIModerationRow[] }> {
  const res = await fetch("/api/protected/admin/ai/moderation", { cache: "no-store" });
  if (!res.ok) return { data: [] };
  return res.json();
}

async function fetchAIFraud(): Promise<{ data: AIFraudRow[] }> {
  const res = await fetch("/api/protected/admin/ai/fraud", { cache: "no-store" });
  if (!res.ok) return { data: [] };
  return res.json();
}

export default function ModerationPage() {
  const qc = useQueryClient();

  const [tab, setTab] = React.useState<"events" | "ai" | "fraud">("events");

  const pendingEventsQ = useQuery({
    queryKey: [...EVENTS_KEY, "pending"],
    queryFn: () => fetchEvents("pending"),
    staleTime: 10_000,
  });
  const approvedEventsQ = useQuery({
    queryKey: [...EVENTS_KEY, "approved"],
    queryFn: () => fetchEvents("approved"),
    staleTime: 30_000,
  });
  const rejectedEventsQ = useQuery({
    queryKey: [...EVENTS_KEY, "rejected"],
    queryFn: () => fetchEvents("rejected"),
    staleTime: 30_000,
  });

  const aiModQ = useQuery({ queryKey: AI_MODERATION_KEY, queryFn: fetchAIModeration, staleTime: 15_000 });
  const aiFraudQ = useQuery({ queryKey: AI_FRAUD_KEY, queryFn: fetchAIFraud, staleTime: 15_000 });

  const approve = useMutation({
    mutationFn: approveEvent,
    onSuccess: () => {
      toast.success("Event approved and published.");
      qc.invalidateQueries({ queryKey: EVENTS_KEY });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to approve"),
  });

  const reject = useMutation({
    mutationFn: (input: { id: string; reason: string }) => rejectEvent(input.id, input.reason),
    onSuccess: () => {
      toast("Event rejected. The organizer has been notified.");
      qc.invalidateQueries({ queryKey: EVENTS_KEY });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reject"),
  });

  const pendingEvents = pendingEventsQ.data?.data ?? [];
  const approvedEvents = approvedEventsQ.data?.data ?? [];
  const rejectedEvents = rejectedEventsQ.data?.data ?? [];

  const aiModeration = aiModQ.data?.data ?? [];
  const aiFraud = aiFraudQ.data?.data ?? [];

  // R1 audit debt: replace window.prompt() with the premium RejectReasonDialog.
  const [rejectTarget, setRejectTarget] = React.useState<AdminEventRow | null>(null);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Content Moderation"
        description="Review events, AI moderation signals, and fraud detections."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="events">Events ({pendingEvents.length})</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Moderation ({aiModeration.length})
          </TabsTrigger>
          <TabsTrigger value="fraud">
            <AlertOctagon className="mr-1 h-3.5 w-3.5" /> AI Fraud ({aiFraud.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-6 space-y-4">
          {pendingEventsQ.isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          )}
          {!pendingEventsQ.isLoading && pendingEvents.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No pending events.</p>
          )}
          {pendingEvents.map((event) => (
            <ModerationCard
              key={event.id}
              event={event}
              isPending={approve.isPending || reject.isPending}
              onApprove={() => approve.mutate(event.id)}
              onReject={() => setRejectTarget(event)}
            />
          ))}

          {(approvedEvents.length > 0 || rejectedEvents.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Recently Approved</h3>
                <div className="space-y-2">
                  {approvedEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">{event.title}</span>
                        <span className="text-xs text-muted-foreground truncate">{event.organizer?.name ?? "—"}</span>
                      </div>
                      <Badge variant="success">Approved</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Recently Rejected</h3>
                <div className="space-y-2">
                  {rejectedEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">{event.title}</span>
                        <span className="text-xs text-muted-foreground truncate">{event.organizer?.name ?? "—"}</span>
                      </div>
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> AI Moderation Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiModQ.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : aiModeration.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No AI moderation signals pending. The AI runs on event submission and review creation; signals appear here when the AI flags content for human review.
                </p>
              ) : (
                <div className="space-y-2">
                  {aiModeration.map((row) => (
                    <div key={row.id} className="p-3 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={row.severity === "high" ? "destructive" : row.severity === "medium" ? "secondary" : "outline"}>
                            {row.severity}
                          </Badge>
                          <span className="text-sm font-medium">{row.content_type}</span>
                        </div>
                        <Badge variant="outline">{row.suggested_action}</Badge>
                      </div>
                      {row.reason && <p className="text-xs text-muted-foreground">{row.reason}</p>}
                      {row.flags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {row.flags.map((f) => (
                            <span key={f} className="text-[10px] bg-muted px-2 py-0.5 rounded-md">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-destructive" /> AI Fraud Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiFraudQ.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : aiFraud.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No open fraud signals. The AI scans each registration; signals appear here when suspicious.
                </p>
              ) : (
                <div className="space-y-2">
                  {aiFraud.map((row) => (
                    <div key={row.id} className="p-3 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold">{(row.risk_score * 100).toFixed(1)}%</span>
                          <Badge variant={row.recommended_action === "block" ? "destructive" : "outline"}>
                            {row.recommended_action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{row.subject_type}</span>
                        </div>
                      </div>
                      {row.reason && <p className="text-xs text-muted-foreground">{row.reason}</p>}
                      {row.flags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {row.flags.map((f) => (
                            <span key={f} className="text-[10px] bg-muted px-2 py-0.5 rounded-md">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RejectReasonDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title={rejectTarget ? `Reject "${rejectTarget.title}"` : 'Reject event'}
        description="The organizer will see this reason in their notifications."
        defaultValue="Insufficient details"
        confirmLabel="Reject event"
        isPending={reject.isPending}
        onConfirm={(reason) => {
          if (!rejectTarget) return;
          reject.mutate(
            { id: rejectTarget.id, reason },
            { onSuccess: () => setRejectTarget(null) }
          );
        }}
      />
    </motion.div>
  );
}
