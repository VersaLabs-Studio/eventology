"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface RegistrationRow {
  id: string;
  user_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: 'confirmed' | 'cancelled' | 'checked_in' | 'waitlisted' | 'pending_payment';
  created_at: string;
  checked_in_at: string | null;
  ticket_tier?: { name: string; price: number; currency: string } | null;
  ticket?: { id: string; ticket_number: string; status: string } | null;
}

interface RegistrationResponse {
  data: RegistrationRow[];
  meta: { total: number };
}

interface RegistrationTableProps {
  eventId: string;
}

const columns: Column<RegistrationRow>[] = [
  { key: 'attendee_name', header: 'Attendee', sortable: true },
  { key: 'attendee_email', header: 'Email', sortable: true },
  { key: 'attendee_phone', header: 'Phone' },
  {
    key: 'ticket_tier',
    header: 'Tier',
    render: (r) => r.ticket_tier?.name ?? '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: (reg) => {
      const variant =
        reg.status === 'confirmed' ? 'success' :
        reg.status === 'checked_in' ? 'default' :
        reg.status === 'cancelled' ? 'destructive' :
        reg.status === 'pending_payment' ? 'warning' :
        'warning';
      return <Badge variant={variant}>{reg.status.replace('_', ' ')}</Badge>;
    },
    sortable: true,
  },
  {
    key: 'created_at',
    header: 'Registered',
    render: (reg) => formatDate(reg.created_at),
    sortable: true,
  },
  {
    key: 'actions',
    header: 'Actions',
    render: () => (
      <div className="flex items-center gap-1">
        <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" title="View">
          <Eye className="h-4 w-4" />
        </button>
      </div>
    ),
  },
];

export function RegistrationTable({ eventId }: RegistrationTableProps) {
  const regsQ = useQuery<RegistrationResponse>({
    queryKey: ['registrations', 'event', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/protected/events/${eventId}/registrations`);
      if (!res.ok) throw new Error('Failed to load registrations');
      return res.json();
    },
  });

  const rows = regsQ.data?.data ?? [];

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.warning('No registrations to export yet');
      return;
    }
    const headers = ['name', 'email', 'phone', 'tier', 'status', 'registered_at'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push([
        JSON.stringify(r.attendee_name ?? ''),
        JSON.stringify(r.attendee_email ?? ''),
        JSON.stringify(r.attendee_phone ?? ''),
        JSON.stringify(r.ticket_tier?.name ?? ''),
        r.status,
        r.created_at,
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} registrations`);
  };

  if (regsQ.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchable
        searchPlaceholder="Search attendees..."
        searchKeys={['attendee_name', 'attendee_email']}
      />
    </div>
  );
}
