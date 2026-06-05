"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/shared/event-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVenue } from "@/hooks/use-venues";
import { useEvents } from "@/hooks/use-events";
import { MapPin, ArrowLeft, Phone, Users, Wifi, ParkingCircle } from "lucide-react";

// Dynamic import — Leaflet touches window, so it must be client-only
const VenueMap = dynamic(
  () => import("@/components/shared/venue-map").then((mod) => mod.VenueMap),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> }
);

const ITEMS_PER_PAGE = 12;

function VenueDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const { data: venue, isLoading, isError } = useVenue(id);
  const [eventsPage, setEventsPage] = React.useState(1);

  // Fetch events at this venue
  const { data: eventsData, isLoading: eventsLoading } = useEvents({
    page: eventsPage,
    limit: ITEMS_PER_PAGE,
    venue: venue?.name ?? undefined,
  });

  const events = eventsData?.data ?? [];
  const eventsTotal = eventsData?.total ?? 0;
  const hasMore = eventsPage * ITEMS_PER_PAGE < eventsTotal;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (isError || !venue) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="font-display font-bold text-2xl mb-2">Venue Not Found</h1>
        <p className="text-muted-foreground mb-6">The venue you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/events">
          <Button variant="outline">Browse Events</Button>
        </Link>
      </div>
    );
  }

  const amenities = (venue.amenities as string[]) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Back link */}
        <Link href="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>

        <PageHeader
          title={venue.name}
          description={venue.address}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
          {/* Map + events */}
          <div className="space-y-8">
            {/* Map */}
            <VenueMap
              lat={venue.latitude}
              lng={venue.longitude}
              title={venue.name}
              address={venue.address}
              height="350px"
            />

            {/* Venue info */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Venue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>{venue.address}, {venue.sub_city}, {venue.city}</span>
                </div>
                {venue.contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span>{venue.contact_phone}</span>
                  </div>
                )}
                {venue.capacity && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary shrink-0" />
                    <span>Capacity: {venue.capacity.toLocaleString()}</span>
                  </div>
                )}
                {venue.description && (
                  <p className="text-sm text-muted-foreground mt-2">{venue.description}</p>
                )}
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {amenities.map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Events at this venue */}
            <section>
              <h2 className="font-display font-semibold text-xl mb-4">
                Events at {venue.name}
                {eventsTotal > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">({eventsTotal})</span>
                )}
              </h2>

              {eventsLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-40 w-full rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              )}

              {!eventsLoading && events.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming events at this venue.</p>
              )}

              {!eventsLoading && events.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {events.map((event, idx) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <EventCard event={event} />
                      </motion.div>
                    ))}
                  </div>
                  {hasMore && (
                    <div className="text-center mt-6">
                      <Button variant="outline" onClick={() => setEventsPage((p) => p + 1)}>
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="font-display text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {venue.address}, {venue.sub_city}
                </p>
                <p className="text-xs text-muted-foreground">
                  {venue.city}, {venue.country}
                </p>
                {venue.latitude && venue.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${venue.latitude},${venue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs text-primary hover:underline"
                  >
                    View on Google Maps →
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VenueDetailPage() {
  return (
    <Suspense>
      <VenueDetailContent />
    </Suspense>
  );
}
