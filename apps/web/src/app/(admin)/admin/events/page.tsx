"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminEventsTable } from "@/components/admin/admin-events-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminEvents, type AdminEventRow } from "@/hooks/use-admin-events";
import { CalendarDays, CheckCircle2, Clock, Star, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Drafts" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export default function AdminEventsPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Debounce the search input → server query.
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to first page whenever the filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [search, status]);

  const { data, isLoading, isError } = useAdminEvents({
    search: search || undefined,
    status: status === "all" ? undefined : status,
    page,
    limit: 12,
  });

  const events = data?.data ?? [];
  const meta = data?.meta;
  const pageCount = meta ? Math.ceil(meta.total / meta.limit) : 1;

  const featureMutation = useMutation({
    mutationFn: async (event: AdminEventRow) => {
      setTogglingId(event.id);
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
      return res.json();
    },
    onSuccess: (_data, event) => {
      toast.success(event.is_featured ? "Event unfeatured" : "Event featured");
      qc.invalidateQueries({ queryKey: ["admin", "events", "list"] });
      qc.invalidateQueries({ queryKey: ["admin", "featured"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
    onSettled: () => setTogglingId(null),
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="Events"
          description="Browse, search, and manage every event on the platform."
          action={
            <Link href="/admin/moderation">
              <Button variant="outline">Moderation Queue</Button>
            </Link>
          }
        />
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={meta?.counts.all ?? 0} icon={CalendarDays} variant="admin" />
        <StatCard title="Approved" value={meta?.counts.approved ?? 0} icon={CheckCircle2} variant="admin" />
        <StatCard title="Pending" value={meta?.counts.pending ?? 0} icon={Clock} variant="admin" />
        <StatCard title="Featured" value={meta?.counts.featured ?? 0} icon={Star} variant="admin" />
      </motion.div>

      {/* Controls */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title, description, venue…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " +
                (status === f.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={CalendarDays}
            title="Failed to load events"
            description="Please check your connection and try again."
          />
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={search || status !== "all" ? "No matching events" : "No events yet"}
            description="Try adjusting your search or filters."
          />
        ) : (
          <AdminEventsTable
            events={events}
            onToggleFeature={(e) => featureMutation.mutate(e)}
            togglingId={togglingId}
          />
        )}
      </motion.div>

      {/* Pagination */}
      {!isLoading && events.length > 0 && (
        <motion.div variants={item} className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {meta ? `Page ${meta.page} of ${pageCount} · ${meta.total} events` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
