"use client";

import * as React from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auditLog } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { AuditLogEntry } from "@/lib/types";

const columns: Column<AuditLogEntry>[] = [
  { key: "timestamp", header: "Timestamp", render: (entry) => formatDate(entry.timestamp), sortable: true },
  { key: "action", header: "Action", sortable: true },
  {
    key: "actor",
    header: "Actor",
    render: (entry) => (
      <div className="flex items-center gap-2">
        <span>{entry.actor}</span>
        <Badge variant={entry.actorRole === "admin" ? "accent" : "default"} className="text-[10px]">{entry.actorRole}</Badge>
      </div>
    ),
    sortable: true,
  },
  { key: "target", header: "Target", sortable: true },
  { key: "details", header: "Details" },
];

export function AuditLogTable() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
          <option>All Actions</option>
          <option>Approve</option>
          <option>Reject</option>
          <option>Feature</option>
          <option>User Management</option>
          <option>Verification</option>
        </select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => toast.success("Log exported successfully.")}>
          <Download className="mr-2 h-4 w-4" /> Export Log
        </Button>
      </div>
      <DataTable columns={columns} data={auditLog} />
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>Page 1 of 3</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-md border border-border hover:bg-muted disabled:opacity-50" disabled>Previous</button>
          <button className="px-3 py-1 rounded-md border border-border hover:bg-muted">Next</button>
        </div>
      </div>
    </div>
  );
}
