"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrganizerVerificationCard } from "@/components/admin/organizer-verification-card";
import { RejectReasonDialog } from "@/components/admin/reject-reason-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AdminOrganizerRow } from "@/app/api/protected/admin/organizers/route";

interface OrganizersResponse {
  data: AdminOrganizerRow[];
  meta: { total: number; page: number; limit: number };
}

const ORGANIZERS_KEY = ["admin", "organizers"] as const;

async function fetchOrganizers(status: string): Promise<OrganizersResponse> {
  const params = new URLSearchParams();
  params.set("limit", "200");
  if (status && status !== "all") params.set("status", status);
  const res = await fetch(`/api/protected/admin/organizers?${params}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to load organizers");
  }
  return (await res.json()) as OrganizersResponse;
}

async function verifyOrganizer(id: string): Promise<AdminOrganizerRow> {
  const res = await fetch(`/api/protected/admin/organizers/${id}/verify`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to verify organizer");
  }
  return (await res.json()) as AdminOrganizerRow;
}

async function rejectOrganizer(id: string, reason: string): Promise<AdminOrganizerRow> {
  const res = await fetch(`/api/protected/admin/organizers/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to reject organizer");
  }
  return (await res.json()) as AdminOrganizerRow;
}

export default function OrganizersPage() {
  const qc = useQueryClient();

  const pendingQ = useQuery({
    queryKey: [...ORGANIZERS_KEY, "pending"],
    queryFn: () => fetchOrganizers("pending"),
    staleTime: 30_000,
  });
  const verifiedQ = useQuery({
    queryKey: [...ORGANIZERS_KEY, "verified"],
    queryFn: () => fetchOrganizers("verified"),
    staleTime: 30_000,
  });
  const rejectedQ = useQuery({
    queryKey: [...ORGANIZERS_KEY, "rejected"],
    queryFn: () => fetchOrganizers("rejected"),
    staleTime: 30_000,
  });

  const verify = useMutation({
    mutationFn: verifyOrganizer,
    onSuccess: () => {
      toast.success("Organizer verified");
      qc.invalidateQueries({ queryKey: ORGANIZERS_KEY });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to verify"),
  });

  const reject = useMutation({
    mutationFn: (input: { id: string; reason: string }) => rejectOrganizer(input.id, input.reason),
    onSuccess: () => {
      toast("Organizer rejected");
      qc.invalidateQueries({ queryKey: ORGANIZERS_KEY });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reject"),
  });

  // R1 audit debt: replace window.prompt() with the premium RejectReasonDialog.
  const [rejectTarget, setRejectTarget] = React.useState<AdminOrganizerRow | null>(null);

  const pending = pendingQ.data?.data ?? [];
  const verified = verifiedQ.data?.data ?? [];
  const rejected = rejectedQ.data?.data ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Organizer Verification" description={`${pending.length} pending verifications`} />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verified.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingQ.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          )}
          {pendingQ.error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
              <p className="text-sm text-destructive">Failed to load pending organizers.</p>
            </div>
          )}
          {!pendingQ.isLoading && !pendingQ.error && pending.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No pending verifications.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((org) => (
              <OrganizerVerificationCard
                key={org.id}
                organizer={org}
                onVerify={() => verify.mutate(org.id)}
                onReject={() => setRejectTarget(org)}
                isPending={verify.isPending || reject.isPending}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verified" className="mt-6">
          {verifiedQ.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          )}
          {!verifiedQ.isLoading && verified.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No verified organizers yet.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verified.map((org) => (
              <OrganizerVerificationCard key={org.id} organizer={org} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedQ.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          )}
          {!rejectedQ.isLoading && rejected.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No rejected applications.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rejected.map((org) => (
              <OrganizerVerificationCard
                key={org.id}
                organizer={org}
                onVerify={() => verify.mutate(org.id)}
                isPending={verify.isPending}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <RejectReasonDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title={rejectTarget ? `Reject "${rejectTarget.name}"` : 'Reject organizer'}
        description="A clear reason helps organizers resubmit successfully."
        defaultValue="Insufficient documentation"
        confirmLabel="Reject organizer"
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
