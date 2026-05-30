"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { registrations } from "@/lib/mock-data";
import { Download, Eye, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Registration } from "@/lib/types";

const columns: Column<Registration>[] = [
  { key: "userName", header: "Attendee Name", sortable: true },
  { key: "userEmail", header: "Email", sortable: true },
  { key: "userPhone", header: "Phone" },
  { key: "ticketTier", header: "Ticket Tier", sortable: true },
  {
    key: "status",
    header: "Status",
    render: (reg) => {
      const variant = reg.status === "confirmed" ? "success" : reg.status === "checked_in" ? "default" : reg.status === "cancelled" ? "destructive" : "warning";
      return <Badge variant={variant}>{reg.status}</Badge>;
    },
    sortable: true,
  },
  {
    key: "registeredAt",
    header: "Date",
    render: (reg) => formatDate(reg.registeredAt),
    sortable: true,
  },
  {
    key: "actions",
    header: "Actions",
    render: (reg) => (
      <div className="flex items-center gap-1">
        <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" title="View">
          <Eye className="h-4 w-4" />
        </button>
        {reg.status === "confirmed" && (
          <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-success" title="Check In">
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    ),
  },
];

export function RegistrationTable() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success("CSV file exported successfully.")}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>
      <DataTable columns={columns} data={registrations} searchable searchPlaceholder="Search attendees..." searchKeys={["userName", "userEmail"]} />
    </div>
  );
}
