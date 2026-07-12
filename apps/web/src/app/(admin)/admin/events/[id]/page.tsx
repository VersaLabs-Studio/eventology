"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { RejectReasonDialog } from "@/components/admin/reject-reason-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminEvent } from "@/hooks/use-admin-events";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Eye,
  TrendingUp,
  Percent,
  ExternalLink,
  Star,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

const statusVariant: Record<string, "success" | "destructive" | "outline" | "default" | "warning"> = {
  approved: "success",
  rejected: "destructive",
  pending: "outline",
  draft: "warning",
  cancelled: "default",
};

export default function AdminEventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const qc = useQueryClient();

  const [rejectTarget, setRejectTarget] = React.useState(false);

  const eventQ = useAdminEvent(eventId);
  const event = eventQ.data;

  const invalidate = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ["admin", "events", "doc", eventId] });
    qc.invalidateQueries({ queryKey: ["admin", "events", "list"] });
    qc.invalidateQueries({ queryKey: ["admin", "featured"] });
  }, [qc, eventId]);

  const featureMutation = useMutation({
    mutationFn: async () => {
      if (!event) return;
      const url = "/api/protected/admin/featured";
      const res = event.is_featured
        ? await fetch(`${url}?id=${encodeURIComponent(event.id)}`, { method: "DELETE" })
        : await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: event.id, duration: "30_days" }),
          });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Failed to update featured status");
      }
    },
    onSuccess: () => {
      toast.success(event?.is_featured ? "Event unfeatured" : "Event featured");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/protected/admin/events/${eventId}/approve`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Failed to approve event");
      }
    },
    onSuccess: () => {
      toast.success("Event approved and published.");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/protected/admin/events/${eventId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Failed to reject event");
      }
    },
    onSuccess: () => {
      toast("Event rejected. The organizer has been notified.");
      setRejectTarget(false);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reject"),
  });

  if (eventQ.isLoading) {
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
    return (
      <EmptyState
        icon={Calendar}
        title="Event not found"
        description="This event may have been removed or the link is invalid."
      />
    );
  }

  const capacityPercent =
    event.capacity > 0 ? Math.round((event.registrations_count / event.capacity) * 100) : 0;
  const conversion =
    event.views_count > 0 ? Math.round((event.registrations_count / event.views_count) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Hero header */}
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
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusVariant[event.status] ?? "default"}>{event.status}</Badge>
              {event.is_featured && <Badge variant="accent">Featured</Badge>}
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white drop-shadow tracking-tight">
              {event.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`);
                toast.success("Public link copied");
              }}
            >
              <Copy className="mr-1 h-4 w-4" /> Share
            </Button>
            <Button asChild variant="accent" size="sm" className="shadow-accent-glow">
              <Link href={`/events/${event.slug}`} className="flex items-center">
                <ExternalLink className="mr-1 h-4 w-4" /> View
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {event.rejection_reason && event.status === "rejected" && (
        <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Rejection reason</p>
          <p className="text-muted-foreground mt-1">{event.rejection_reason}</p>
        </div>
      )}

      {/* Admin actions */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button
          variant={event.is_featured ? "outline" : "default"}
          size="sm"
          disabled={featureMutation.isPending}
          onClick={() => featureMutation.mutate()}
          className={event.is_featured ? "text-accent border-accent/30" : ""}
        >
          <Star className={`mr-1 h-4 w-4 ${event.is_featured ? "fill-accent" : ""}`} />
          {event.is_featured ? "Unfeature" : "Feature"}
        </Button>
        {event.status === "pending" && (
          <>
            <Button
              variant="accent"
              size="sm"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={rejectMutation.isPending}
              onClick={() => setRejectTarget(true)}
            >
              <XCircle className="mr-1 h-4 w-4" /> Reject
            </Button>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Views" value={event.views_count} icon={Eye} variant="admin" />
        <StatCard title="Registrations" value={event.registrations_count} icon={Calendar} variant="admin" />
        <StatCard title="Capacity" value={`${capacityPercent}%`} icon={TrendingUp} variant="admin" />
        <StatCard title="Conversion" value={`${conversion}%`} icon={Percent} variant="admin" />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Event Details
            </h3>
            <DetailRow label="Date" value={formatDate(event.start_date)} />
            <DetailRow label="Ends" value={formatDate(event.end_date)} />
            {event.venue_name && <DetailRow label="Venue" value={event.venue_name} />}
            {event.sub_city && <DetailRow label="Sub-city" value={event.sub_city} />}
            <DetailRow label="Type" value={event.event_type} capitalize />
            <DetailRow
              label="Pricing"
              value={event.ticket_type === "free" ? "Free" : "Paid"}
            />
            <DetailRow label="Capacity" value={String(event.capacity)} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Organizer & Category
            </h3>
            {event.organizer && (
              <DetailRow
                label="Organizer"
                value={`${event.organizer.name}${event.organizer.is_verified ? " ✓" : ""}`}
              />
            )}
            {event.category && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${event.category.color}1a`, color: event.category.color }}
                >
                  {event.category.name}
                </span>
              </div>
            )}
            <DetailRow label="Slug" value={event.slug} />
            <DetailRow label="Featured" value={event.is_featured ? "Yes" : "No"} />
            {event.is_featured && event.featured_until && (
              <DetailRow label="Featured until" value={formatDate(event.featured_until)} />
            )}
            <DetailRow label="Created" value={formatDate(event.created_at)} />
          </CardContent>
        </Card>
      </div>

      {/* Ticket tiers */}
      {event.ticket_tiers.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-5">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Ticket Tiers
            </h3>
            <div className="space-y-2">
              {event.ticket_tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                >
                  <span className="text-sm font-medium">{tier.name}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {tier.price > 0 ? `${tier.price} ${tier.currency}` : "Free"} · {tier.sold_count}/
                    {tier.capacity} sold
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <RejectReasonDialog
        open={rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(false)}
        title={`Reject "${event.title}"`}
        description="The organizer will see this reason in their notifications."
        defaultValue="Insufficient details"
        confirmLabel="Reject event"
        isPending={rejectMutation.isPending}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
      />
    </motion.div>
  );
}

function DetailRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
