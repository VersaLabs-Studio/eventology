"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { CheckInScanner } from "@/components/dashboard/check-in-scanner";
import { getEventById } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export default function CheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = getEventById(eventId);

  if (!event) notFound();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title={`QR Check-In — ${event.title}`} />
      <div className="max-w-lg mx-auto">
        <CheckInScanner totalAttendees={event.capacity} checkedInCount={event.registrations} />
      </div>
    </motion.div>
  );
}
