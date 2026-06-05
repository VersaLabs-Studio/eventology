"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMyRegistrations } from "@/hooks/use-registrations";
import { formatDate } from "@/lib/utils";
import { CalendarDays, Ticket, MapPin, ExternalLink } from "lucide-react";

const statusColors: Record<string, "success" | "warning" | "default" | "destructive"> = {
  confirmed: "success",
  pending_payment: "warning",
  pending: "warning",
  cancelled: "destructive",
  checked_in: "success",
};

export default function MyEventsPage() {
  const { data: registrationsData, isLoading } = useMyRegistrations({ limit: 50 });
  const registrations = registrationsData?.data ?? [];

  const now = new Date();
  const upcoming = registrations.filter((r) => {
    if (r.status === "cancelled") return false;
    const eventDate = r.event?.start_date ? new Date(r.event.start_date) : null;
    return eventDate && eventDate >= now;
  });

  const past = registrations.filter((r) => {
    if (r.status === "cancelled") return false;
    const eventDate = r.event?.start_date ? new Date(r.event.start_date) : null;
    return eventDate && eventDate < now;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="My Events" description="Your upcoming and past events" />

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            <TabsTrigger value="all">All ({registrations.length})</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="mt-6">
                {upcoming.length > 0 ? (
                  <div className="space-y-4">
                    {upcoming.map((reg) => (
                      <RegistrationCard key={reg.id} registration={reg} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title="No upcoming events"
                    description="Discover events to get started"
                    action={{ label: "Browse Events", onClick: () => window.location.href = "/events" }}
                  />
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-6">
                {past.length > 0 ? (
                  <div className="space-y-4 opacity-80">
                    {past.map((reg) => (
                      <RegistrationCard key={reg.id} registration={reg} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title="No past events"
                    description="Events you've attended will appear here"
                  />
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                {registrations.length > 0 ? (
                  <div className="space-y-4">
                    {registrations.map((reg) => (
                      <RegistrationCard key={reg.id} registration={reg} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Ticket}
                    title="No registrations yet"
                    description="Register for an event to get started"
                    action={{ label: "Browse Events", onClick: () => window.location.href = "/events" }}
                  />
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}

function RegistrationCard({ registration }: { registration: import("@/hooks/use-registrations").RegistrationWithRelations }) {
  return (
    <Card hoverable>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
            <Image
              src={registration.event?.banner_image ?? "/placeholder-event.jpg"}
              alt={registration.event?.title ?? "Event"}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/events/${registration.event?.slug ?? registration.event_id}`}
              className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
            >
              {registration.event?.title ?? "Event"}
            </Link>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {registration.event?.start_date ? formatDate(registration.event.start_date) : "Date TBA"}
              </span>
              {registration.event?.venue_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {registration.event.venue_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={statusColors[registration.status] || "default"}>
                {registration.status.replace("_", " ")}
              </Badge>
              {registration.ticket_tier && (
                <Badge variant="outline">{registration.ticket_tier.name}</Badge>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {registration.ticket && (
              <Link href={`/ticket/${registration.ticket.id}`}>
                <Button variant="outline" size="sm">
                  <Ticket className="mr-2 h-3 w-3" />
                  View Ticket
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
