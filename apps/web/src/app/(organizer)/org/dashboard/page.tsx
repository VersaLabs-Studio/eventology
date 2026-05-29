"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { AreaChartComponent, BarChartComponent } from "@/components/ui/chart";
import { Calendar, Users, Eye, TrendingUp, ChevronRight } from "lucide-react";
import { events, organizers, viewsOverTime, registrationTrends } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";

const mockOrganizer = organizers[0];

const recentColumns: Column<Event>[] = [
  { key: "title", header: "Event", sortable: true },
  { key: "date", header: "Date", render: (e) => formatDate(e.date), sortable: true },
  {
    key: "status",
    header: "Status",
    render: (e) => {
      const v = e.status === "approved" ? "success" : e.status === "draft" ? "warning" : "default";
      return <Badge variant={v}>{e.status}</Badge>;
    },
    sortable: true,
  },
  { key: "registrations", header: "Reg / Cap", render: (e) => `${e.registrations} / ${e.capacity}` },
  { key: "views", header: "Views", sortable: true },
  {
    key: "actions",
    header: "Actions",
    render: () => (
      <select className="h-8 rounded-md border border-border bg-background px-2 text-xs">
        <option>Actions</option>
        <option>Edit</option>
        <option>View Analytics</option>
        <option>Duplicate</option>
        <option>Preview</option>
      </select>
    ),
  },
];

export default function OrgDashboardPage() {
  const orgEvents = events.filter((e) => e.organizer.id === mockOrganizer.id);
  const totalReg = orgEvents.reduce((s, e) => s + e.registrations, 0);
  const totalViews = orgEvents.reduce((s, e) => s + e.views, 0);
  const conversion = totalViews > 0 ? Math.round((totalReg / totalViews) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Organizer Dashboard" description={`Welcome back, ${mockOrganizer.name}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Events" value={orgEvents.length} change={12} icon={Calendar} />
        <StatCard title="Total Registrations" value={totalReg} change={8} icon={Users} />
        <StatCard title="Total Views" value={totalViews} change={15} icon={Eye} />
        <StatCard title="Conversion Rate" value={`${conversion}%`} change={3} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Registrations Over Time</h3>
          <AreaChartComponent data={registrationTrends} />
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Views Over Time</h3>
          <BarChartComponent data={viewsOverTime} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm">Recent Events</h3>
          <Link href="/org/events">
            <Button variant="ghost" size="sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>
        <DataTable columns={recentColumns} data={orgEvents.slice(0, 5)} />
      </div>
    </motion.div>
  );
}
