"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { RegistrationTable } from "@/components/dashboard/registration-table";
import { getEventById } from "@/lib/mock-data";
import { getEventRegistrations } from "@/lib/mock-data";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { notFound } from "next/navigation";

export default function RegistrationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = getEventById(eventId);

  if (!event) notFound();

  const regs = getEventRegistrations(eventId);
  const checkedIn = regs.filter((r) => r.status === "checked_in").length;
  const cancelled = regs.filter((r) => r.status === "cancelled").length;
  const waitlisted = regs.filter((r) => r.status === "waitlisted").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title={`Registrations for ${event.title}`} />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Registered" value={regs.length} icon={Users} />
        <StatCard title="Checked In" value={checkedIn} icon={CheckCircle} />
        <StatCard title="Cancelled" value={cancelled} icon={XCircle} trend="down" />
        <StatCard title="Waitlisted" value={waitlisted} icon={Clock} />
      </div>
      <RegistrationTable />
    </motion.div>
  );
}
