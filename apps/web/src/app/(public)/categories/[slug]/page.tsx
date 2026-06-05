"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { EventCard } from "@/components/shared/event-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/hooks/use-events";
import { useCategories } from "@/hooks/use-categories";
import { Search, ArrowLeft } from "lucide-react";

const ITEMS_PER_PAGE = 12;

function CategoryEventsContent() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = React.useState(1);

  // Fetch category info
  const { data: categoriesData } = useCategories();
  const category = (categoriesData?.data ?? []).find((c) => c.slug === slug);

  // Fetch events for this category (uses !inner join in the API)
  const { data, isLoading, isError } = useEvents({
    page,
    limit: ITEMS_PER_PAGE,
    category: slug,
  });

  const events = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = page * ITEMS_PER_PAGE < total;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link href="/categories" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> All Categories
      </Link>

      <PageHeader
        title={category?.name ?? slug}
        description={isLoading ? "Loading events…" : `${total} ${total === 1 ? "event" : "events"} in this category`}
        action={
          category ? (
            <Badge variant="secondary" className="text-sm">
              {category.event_count} total
            </Badge>
          ) : undefined
        }
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <EmptyState
          icon={Search}
          title="Failed to load events"
          description="Please check your connection and try again."
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && events.length === 0 && (
        <EmptyState
          icon={Search}
          title="No events in this category"
          description="Check back later or browse other categories."
          action={{ label: "Browse Categories", onClick: () => window.location.href = "/categories" }}
        />
      )}

      {/* Event grid */}
      {!isLoading && !isError && events.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {events.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CategoryEventsPage() {
  return (
    <Suspense>
      <CategoryEventsContent />
    </Suspense>
  );
}
