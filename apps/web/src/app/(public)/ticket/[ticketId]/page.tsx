"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TicketView } from "@/components/public/ticket-view";
import { useTicket } from "@/hooks/use-tickets";
import { TransferTicketDialog } from "@/components/tickets/transfer-ticket-dialog";
import { AddToWallet } from "@/components/tickets/add-to-wallet";
import { useLocale } from "@/lib/i18n";
import { Ticket, Calendar, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;

  const { data: ticket, isLoading, isError } = useTicket(ticketId);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <EmptyState
          icon={Ticket}
          title="Ticket not found"
          description="This ticket may have been removed or you don't have access to it."
          action={{ label: "My Events", onClick: () => window.location.href = "/my-events" }}
        />
      </div>
    );
  }

  // Transform ticket data for TicketView component
  const ticketData = {
    id: ticket.id,
    registrationId: ticket.registration_id,
    eventId: ticket.event_id,
    event: ticket.event ? {
      id: ticket.event.id,
      slug: ticket.event.slug,
      title: ticket.event.title,
      description: "",
      shortDescription: "",
      category: { id: "", name: "", slug: "", icon: "", description: "", eventCount: 0, color: "" },
      type: "conference" as const,
      status: "approved" as const,
      date: ticket.event.start_date,
      endDate: ticket.event.end_date,
      time: "",
      endTime: "",
      location: ticket.event.venue_name ?? "",
      address: "",
      subCity: "",
      locationType: "in_person" as const,
      coordinates: { lat: 0, lng: 0 },
      bannerImage: ticket.event.banner_image ?? "",
      gallery: [],
      organizer: { id: "", name: "", slug: "", email: "", phone: "", avatar: "", bio: "", verified: false, eventsCount: 0, totalAttendees: 0, joinedDate: "" },
      ticketTiers: [],
      ticketType: "free" as const,
      tags: [],
      isFeatured: false,
      views: 0,
      registrations: 0,
      capacity: 0,
      createdAt: "",
    } : {
      id: "",
      slug: "",
      title: "Event",
      description: "",
      shortDescription: "",
      category: { id: "", name: "", slug: "", icon: "", description: "", eventCount: 0, color: "" },
      type: "conference" as const,
      status: "approved" as const,
      date: "",
      endDate: "",
      time: "",
      endTime: "",
      location: "",
      address: "",
      subCity: "",
      locationType: "in_person" as const,
      coordinates: { lat: 0, lng: 0 },
      bannerImage: "",
      gallery: [],
      organizer: { id: "", name: "", slug: "", email: "", phone: "", avatar: "", bio: "", verified: false, eventsCount: 0, totalAttendees: 0, joinedDate: "" },
      ticketTiers: [],
      ticketType: "free" as const,
      tags: [],
      isFeatured: false,
      views: 0,
      registrations: 0,
      capacity: 0,
      createdAt: "",
    },
    attendeeName: ticket.registration?.attendee_name ?? "",
    attendeeEmail: ticket.registration?.attendee_email ?? "",
    ticketTier: ticket.tier_name,
    qrData: ticket.qr_data,
    status: ticket.status as "valid" | "used" | "cancelled",
    issuedAt: ticket.issued_at,
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 print:max-w-none print:p-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="print:hidden">
          <PageHeader title={`Your Ticket — ${ticket.event?.title ?? "Event"}`} />
        </div>
        <TicketView ticket={ticketData} />

        {/* HO-G: transfer / release-to-waitlist (valid + pre-event only; server enforces) */}
        {ticket.status === "valid" && (
          <div className="mt-4 flex justify-center print:hidden">
            <TransferTicketButton
              ticketId={ticket.id}
              eventStartDate={ticket.event?.start_date ?? null}
            />
          </div>
        )}

        {/* HO-H: add to Apple / Google Wallet (server-issued passes) */}
        <div className="mt-4 print:hidden">
          <AddToWallet ticketId={ticket.id} />
        </div>

        <div className="mt-6 text-center print:hidden">
          <Link href="/my-events">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              View All My Events
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

/** HO-G: Transfer action + dialog wiring for the ticket detail page. */
function TransferTicketButton({
  ticketId,
  eventStartDate,
}: {
  ticketId: string;
  eventStartDate: string | null;
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="min-h-[44px] rounded-xl font-bold">
        <ArrowRightLeft className="mr-2 h-4 w-4" />
        {t("transfer.title")}
      </Button>
      <TransferTicketDialog
        ticketId={ticketId}
        eventStartDate={eventStartDate}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
