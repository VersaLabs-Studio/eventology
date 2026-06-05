"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { RegistrationTable } from "@/components/dashboard/registration-table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useEventRegistrations } from "@/hooks/use-registrations";
import { Users, CheckCircle, XCircle, Clock, CalendarDays } from "lucide-react";

export default function RegistrationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const { data: registrationsData, isLoading, isError } = useEventRegistrations(eventId);
  const registrations = registrationsData?.data ?? [];

  const checkedIn = registrations.filter((r) => r.status === "checked_in").length;
  const cancelled = registrations.filter((r) => r.status === "cancelled").length;
  const waitlisted = registrations.filter((r) => r.status === "waitlisted").length;
  const confirmed = registrations.filter((r) => r.status === "confirmed").length;

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Event Registrations" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="Event Registrations" />
        <EmptyState
          icon={CalendarDays}
          title="Failed to load registrations"
          description="You may not have permission to view registrations for this event."
        />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title={`Registrations (${registrations.length})`} />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Registered" value={registrations.length} icon={Users} />
        <StatCard title="Confirmed" value={confirmed} icon={CheckCircle} />
        <StatCard title="Cancelled" value={cancelled} icon={XCircle} trend="down" />
        <StatCard title="Checked In" value={checkedIn} icon={Clock} />
      </div>

      {registrations.length > 0 ? (
        <RegistrationTable />
      ) : (
        <EmptyState
          icon={Users}
          title="No registrations yet"
          description="Registrations will appear here once users register for this event."
        />
      )}
    </motion.div>
  );
}
