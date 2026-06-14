"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { CheckInScanner } from "@/components/dashboard/check-in-scanner";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useEventRegistrations } from "@/hooks/use-registrations";
import { CalendarDays } from "lucide-react";

export default function CheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const { data: registrationsData, isLoading, isError } = useEventRegistrations(eventId);
  const registrations = registrationsData?.data ?? [];

  const checkedIn = registrations.filter((r) => r.status === "checked_in").length;
  const totalAttendees = registrations.filter((r) => r.status === "confirmed" || r.status === "checked_in").length;

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="QR Check-In" />
        <div className="max-w-lg mx-auto space-y-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="QR Check-In" />
        <div className="max-w-lg mx-auto">
          <EmptyState
            icon={CalendarDays}
            title="Failed to load registrations"
            description="You may not have permission to check in for this event."
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="QR Check-In" />
      <div className="max-w-lg mx-auto">
        <CheckInScanner
          eventId={eventId}
          totalAttendees={totalAttendees}
          checkedInCount={checkedIn}
        />
      </div>
    </motion.div>
  );
}
