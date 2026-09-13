"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TicketView } from "@/components/public/ticket-view";
import { useTicket, type TicketWithRelations } from "@/hooks/use-tickets";
import { TransferTicketDialog } from "@/components/tickets/transfer-ticket-dialog";
import { AddToWallet } from "@/components/tickets/add-to-wallet";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import {
  setTicketCachePartition,
  putTicket,
  getTicket,
  evictIfVersionChanged,
  evictTicket,
} from "@/lib/pwa/ticket-cache";
import type { CachedTicket } from "@/lib/pwa/types";
import { Ticket, Calendar, ArrowRightLeft, WifiOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const { t } = useLocale();
  const { user } = useAuth();

  const { data: ticketQ, isLoading, isError } = useTicket(ticketId);

  // HO-L: partition the offline cache by the signed-in profile BEFORE any
  // cache read/write — cross-user isolation is namespaced by profile id.
  React.useEffect(() => {
    setTicketCachePartition(user?.id ?? null);
  }, [user?.id]);

  const [cached, setCached] = React.useState<CachedTicket | null>(null);
  const [showingFromCache, setShowingFromCache] = React.useState(false);

  // Online success: reconcile versions (a transfer rotates qr_version —
  // HO-G), refresh the cache with the server payload, and surface the
  // "available offline / last synced" state.
  React.useEffect(() => {
    if (!ticketQ) return;
    void (async () => {
      await evictIfVersionChanged(ticketId, ticketQ.qr_version);
      await putTicket(ticketId, ticketQ);
      setCached(await getTicket(ticketId));
      setShowingFromCache(false);
    })();
  }, [ticketQ, ticketId]);

  // Fetch error: if we're OFFLINE, fall back to the cached payload; if
  // we're ONLINE, the denial is authoritative (e.g. ticket transferred
  // away) — evict so the stale QR can't be used offline later.
  React.useEffect(() => {
    if (!isError) return;
    void (async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await evictTicket(ticketId);
        setCached(null);
        return;
      }
      const entry = await getTicket(ticketId);
      if (entry) {
        setCached(entry);
        setShowingFromCache(true);
      }
    })();
  }, [isError, ticketId]);

  // The payload to render: live server data, or the verbatim cached copy.
  const source = (showingFromCache ? cached?.payload : ticketQ) as TicketWithRelations | undefined;

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <EmptyState
          icon={Ticket}
          title={t("ticket.notFoundTitle")}
          description={t("ticket.notFoundBody")}
          action={{ label: t("ticket.myEvents"), onClick: () => window.location.href = "/my-events" }}
        />
      </div>
    );
  }

  const ticket = source;
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
          <PageHeader title={t("ticket.yourTicket", { event: source.event?.title ?? "Event" })} />
        </div>

        {/* HO-L: offline / last-synced state — never silently show a cached QR */}
        {showingFromCache ? (
          <div
            className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs print:hidden"
            role="status"
          >
            <WifiOff className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              {t("pwa.offlineNotice", {
                time: cached ? new Date(cached.cachedAt).toLocaleString() : "",
              })}
            </span>
          </div>
        ) : (
          cached && (
            <div
              className="mb-3 flex items-center gap-2 px-1 text-xs text-muted-foreground print:hidden"
              role="status"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              {t("pwa.availableOffline", {
                time: new Date(cached.cachedAt).toLocaleTimeString(),
              })}
            </div>
          )
        )}

        <TicketView ticket={ticketData} />

        {/* HO-G: transfer / release-to-waitlist (valid + pre-event only; server enforces).
            Hidden when rendering from cache — these actions need the network. */}
        {ticket.status === "valid" && !showingFromCache && (
          <div className="mt-4 flex justify-center print:hidden">
            <TransferTicketButton
              ticketId={ticket.id}
              eventStartDate={ticket.event?.start_date ?? null}
            />
          </div>
        )}

        {/* HO-H: add to Apple / Google Wallet (server-issued passes). Hidden offline. */}
        {!showingFromCache && (
          <div className="mt-4 print:hidden">
            <AddToWallet ticketId={ticket.id} />
          </div>
        )}

        <div className="mt-6 text-center print:hidden">
          <Link href="/my-events">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              {t("ticket.myEvents")}
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
