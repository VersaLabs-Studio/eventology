"use client";

import * as React from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { AuditLogRow } from "@/app/api/protected/admin/audit-log/route";

const AUDIT_KEY = ["admin", "audit-log"] as const;

interface AuditResponse {
  data: AuditLogRow[];
  meta: { total: number; page: number; limit: number };
}

async function fetchAuditLog(page: number, action: string): Promise<AuditResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "50");
  if (action && action !== "all") params.set("action", action);
  const res = await fetch(`/api/protected/admin/audit-log?${params}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to load audit log");
  }
  return (await res.json()) as AuditResponse;
}

const ACTION_OPTIONS = [
  "all",
  "event_approved",
  "event_rejected",
  "event_featured",
  "event_unfeatured",
  "organizer_verified",
  "organizer_rejected",
  "user_activated",
  "user_deactivated",
  "user_role_changed",
] as const;

function humanizeAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function exportCsv(rows: AuditLogRow[]): void {
  const header = ["timestamp", "actor", "actor_role", "action", "target_type", "target_label", "details"];
  const escape = (val: string | null) => `"${(val ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [r.created_at, r.actor_name, r.actor_role, r.action, r.target_type, r.target_label, r.details].map(escape).join(",")
  );
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AuditLogTable() {
  const [page, setPage] = React.useState(1);
  const [actionFilter, setActionFilter] = React.useState<string>("all");

  const auditQ = useQuery({
    queryKey: [...AUDIT_KEY, page, actionFilter],
    queryFn: () => fetchAuditLog(page, actionFilter),
    staleTime: 10_000,
  });

  const columns: Column<AuditLogRow>[] = [
    { key: "created_at", header: "Timestamp", render: (e) => formatDate(e.created_at), sortable: true },
    {
      key: "action",
      header: "Action",
      render: (e) => <Badge variant="outline">{humanizeAction(e.action)}</Badge>,
      sortable: true,
    },
    {
      key: "actor",
      header: "Actor",
      render: (e) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[160px]">{e.actor_name ?? "—"}</span>
          {e.actor_role && (
            <Badge variant={e.actor_role === "admin" ? "accent" : "default"} className="text-[10px]">{e.actor_role}</Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    { key: "target_label", header: "Target", render: (e) => <span className="truncate max-w-[200px] inline-block">{e.target_label ?? "—"}</span>, sortable: true },
    { key: "details", header: "Details", render: (e) => <span className="truncate max-w-[260px] inline-block text-muted-foreground">{e.details ?? ""}</span> },
  ];

  const rows = auditQ.data?.data ?? [];
  const total = auditQ.data?.meta.total ?? 0;
  const limit = auditQ.data?.meta.limit ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a === "all" ? "All Actions" : humanizeAction(a)}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (rows.length === 0) {
              toast.error("Nothing to export yet");
              return;
            }
            exportCsv(rows);
            toast.success(`Exported ${rows.length} entries.`);
          }}
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {auditQ.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      )}
      {auditQ.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-destructive">Failed to load audit log.</p>
        </div>
      )}

      {!auditQ.isLoading && !auditQ.error && (
        <DataTable columns={columns} data={rows} />
      )}

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages} · {total} entries
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md border border-border hover:bg-muted disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-3 w-3 inline" /> Previous
          </button>
          <button
            className="px-3 py-1 rounded-md border border-border hover:bg-muted disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight className="h-3 w-3 inline" />
          </button>
        </div>
      </div>
    </div>
  );
}
