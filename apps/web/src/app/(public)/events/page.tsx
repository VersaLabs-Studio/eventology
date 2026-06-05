"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { EventCard } from "@/components/shared/event-card";
import { FilterSidebar, type FilterState } from "@/components/shared/filter-sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-events";
import { Search, SlidersHorizontal, X } from "lucide-react";

const ITEMS_PER_PAGE = 12;

function EventsContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState("date-desc");
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const [filters, setFilters] = React.useState<FilterState>({
    categories: searchParams.get("category") ? [searchParams.get("category")!] : [],
    dateRange: null,
    subCity: null,
    price: "all",
    eventTypes: [],
  });

  // Build query options from filters + sort
  const queryOptions = React.useMemo(() => ({
    page,
    limit: ITEMS_PER_PAGE,
    sort,
    category: filters.categories[0] ?? undefined,
  }), [page, sort, filters.categories]);

  const { data, isLoading, isError } = useEvents(queryOptions);

  const events = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = page * ITEMS_PER_PAGE < total;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Discover Events"
        description={isLoading ? "Loading events…" : `Showing ${events.length} of ${total} events`}
      />

      <div className="flex gap-8">
        <div className="hidden lg:block">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <button
              className="lg:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <div className="flex-1" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="date-desc">Date: Newest</option>
              <option value="date-asc">Date: Oldest</option>
              <option value="popular">Most Popular</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

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
              title="No events match your filters"
              description="Try adjusting your filter criteria"
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
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-card p-6 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar filters={filters} onChange={setFilters} />
            <Button className="w-full mt-6" onClick={() => setMobileFiltersOpen(false)}>Apply Filters</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense>
      <EventsContent />
    </Suspense>
  );
}
