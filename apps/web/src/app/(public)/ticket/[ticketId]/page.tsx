"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { TicketView } from "@/components/public/ticket-view";
import { getEventById } from "@/lib/mock-data";
import type { Ticket } from "@/lib/types";
import { notFound } from "next/navigation";

export default function TicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;

  const event = getEventById("evt_001");
  if (!event) notFound();

  const ticket: Ticket = {
    id: ticketId,
    registrationId: "reg_001",
    eventId: event.id,
    event,
    attendeeName: "Abebe Kebede",
    attendeeEmail: "abebe.k@email.com",
    ticketTier: "VIP",
    qrData: ticketId,
    status: "valid",
    issuedAt: new Date().toISOString(),
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title={`Your Ticket — ${event.title}`} />
        <TicketView ticket={ticket} />
      </motion.div>
    </div>
  );
}
