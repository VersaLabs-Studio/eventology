"use client";

import * as React from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { FallbackImage } from "@/components/shared/fallback-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Eye, Loader2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import type { AdminEventRow } from "@/hooks/use-admin-events";

const statusVariant: Record<string, "success" | "destructive" | "outline" | "default" | "warning"> = {
  approved: "success",
  rejected: "destructive",
  pending: "outline",
  draft: "warning",
  cancelled: "default",
};

interface AdminEventsTableProps {
  events: AdminEventRow[];
  onToggleFeature: (event: AdminEventRow) => void;
  togglingId: string | null;
}

export function AdminEventsTable({ events, onToggleFeature, togglingId }: AdminEventsTableProps) {
  const columns = React.useMemo(
    () =>
      [
        {
          key: "title",
          header: "Event",
          render: (e: AdminEventRow) => (
            <div className="flex items-center gap-3 min-w-0">
              <FallbackImage
                src={e.banner_image ?? ""}
                alt={e.title}
                categoryHint={e.category?.slug}
                aspectRatio="square"
                className="h-11 w-11 shrink-0 rounded-lg"
              />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate max-w-[220px]">{e.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{e.event_type}</p>
              </div>
            </div>
          ),
        },
        {
          key: "organizer",
          header: "Organizer",
          render: (e: AdminEventRow) => (
            <span className="text-sm">
              {e.organizer?.name ?? "—"}
              {e.organizer?.is_verified && (
                <span className="ml-1 text-accent" title="Verified">
                  ✓
                </span>
              )}
            </span>
          ),
        },
        {
          key: "category",
          header: "Category",
          render: (e: AdminEventRow) =>
            e.category ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-xs font-medium">
                {/* category.color is a Tailwind class (e.g. "bg-blue-500"), not a
                    hex — render it as a swatch dot rather than interpolating it. */}
                <span className={cn("h-2 w-2 rounded-full", e.category.color)} />
                {e.category.name}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            ),
        },
        {
          key: "status",
          header: "Status",
          render: (e: AdminEventRow) => (
            <Badge variant={statusVariant[e.status] ?? "default"}>{e.status}</Badge>
          ),
        },
        {
          key: "start_date",
          header: "Date",
          render: (e: AdminEventRow) => (
            <span className="text-sm text-muted-foreground">{formatDate(e.start_date)}</span>
          ),
        },
        {
          key: "registrations_count",
          header: "Regs",
          render: (e: AdminEventRow) => (
            <span className="text-sm tabular-nums">{e.registrations_count}</span>
          ),
        },
        {
          key: "actions",
          header: "",
          render: (e: AdminEventRow) => (
            <div className="flex items-center justify-end gap-1.5">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/events/${e.id}`}>
                  <Eye className="mr-1 h-3.5 w-3.5" /> View
                </Link>
              </Button>
              <Button
                variant={e.is_featured ? "outline" : "ghost"}
                size="sm"
                disabled={togglingId === e.id}
                onClick={() => onToggleFeature(e)}
                className={e.is_featured ? "text-accent border-accent/30" : ""}
              >
                {togglingId === e.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Star className={`h-3.5 w-3.5 ${e.is_featured ? "fill-accent" : ""}`} />
                )}
                {e.is_featured ? "Featured" : "Feature"}
              </Button>
            </div>
          ),
        },
      ] as const,
    [togglingId]
  );

  return (
    <DataTable
      columns={columns as unknown as Array<{ key: string; header: string; render?: (i: AdminEventRow) => React.ReactNode }>}
      data={events}
      searchable={false}
    />
  );
}
