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
import { events } from "@/lib/mock-data";
import { Search, SlidersHorizontal, X } from "lucide-react";

const ITEMS_PER_PAGE = 12;

function EventsContent() {
  const searchParams = useSearchParams();
  const [visibleCount, setVisibleCount] = React.useState(ITEMS_PER_PAGE);
  const [sort, setSort] = React.useState("date-desc");
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const [filters, setFilters] = React.useState<FilterState>({
    categories: searchParams.get("category") ? [searchParams.get("category")!] : [],
    dateRange: null,
    subCity: null,
    price: "all",
    eventTypes: [],
  });

  const filtered = React.useMemo(() => {
    let result = [...events];
    if (filters.categories.length > 0) {
      result = result.filter((e) => filters.categories.includes(e.category.slug));
    }
    if (filters.subCity) {
      result = result.filter((e) => e.subCity.toLowerCase() === (filters.subCity as string).toLowerCase());
    }
    if (filters.price === "free") {
      result = result.filter((e) => e.ticketType === "free");
    } else if (filters.price === "paid") {
      result = result.filter((e) => e.ticketType === "paid");
    }
    if (filters.eventTypes.length > 0) {
      result = result.filter((e) => filters.eventTypes.includes(e.type));
    }
    switch (sort) {
      case "date-asc": result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); break;
      case "date-desc": result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); break;
      case "popular": result.sort((a, b) => b.registrations - a.registrations); break;
      case "name": result.sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return result;
  }, [filters, sort]);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Discover Events"
        description={`Showing ${displayed.length} of ${filtered.length} events`}
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
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="date-desc">Date: Newest</option>
              <option value="date-asc">Date: Oldest</option>
              <option value="popular">Most Popular</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {displayed.length === 0 ? (
            <EmptyState icon={Search} title="No events match your filters" description="Try adjusting your filter criteria" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayed.map((event, idx) => (
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
                  <Button variant="outline" onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}>
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
