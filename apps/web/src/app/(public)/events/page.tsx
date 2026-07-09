"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { EventCard } from "@/components/shared/event-card";
import { FilterSidebar, type FilterState } from "@/components/shared/filter-sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/shared/search-bar";
import { useEvents } from "@/hooks/use-events";
import { useCategories } from "@/hooks/use-categories";
import { Search, SlidersHorizontal, X } from "lucide-react";

const ITEMS_PER_PAGE = 12;

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState(searchParams.get("sort") ?? "date-desc");
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Initialize filters from URL params
  const [filters, setFilters] = React.useState<FilterState>({
    categories: searchParams.get("category") ? [searchParams.get("category")!] : [],
    dateRange: searchParams.get("date") ? formatdateParam(searchParams.get("date")!) : null,
    subCity: searchParams.get("city") ?? null,
    price: (searchParams.get("price") as FilterState["price"]) ?? "all",
    eventTypes: searchParams.get("type") ? [searchParams.get("type")!] : [],
  });

  // Fetch categories from API
  const { data: categoriesData } = useCategories();
  const categories = (categoriesData?.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon ?? "",
    description: "",
    eventCount: 0,
    color: c.color ?? "",
  }));

  // Map dateRange label to API param
  const dateParam = React.useMemo(() => {
    switch (filters.dateRange) {
      case "Today": return "today";
      case "This Week": return "this-week";
      case "This Month": return "this-month";
      case "Upcoming": return "upcoming";
      default: return undefined;
    }
  }, [filters.dateRange]);

  // Build query options from filters + sort
  const queryOptions = React.useMemo(() => ({
    page,
    limit: ITEMS_PER_PAGE,
    sort,
    search: debouncedSearch || undefined,
    category: filters.categories[0] ?? undefined,
    date: dateParam,
    price: filters.price !== "all" ? filters.price : undefined,
    city: filters.subCity ?? undefined,
    type: filters.eventTypes[0] ?? undefined,
  }), [page, sort, debouncedSearch, filters, dateParam]);

  const { data, isLoading, isError } = useEvents(queryOptions);

  const events = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = page * ITEMS_PER_PAGE < total;

  // Sync filters to URL params (for shareable searches)
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sort !== "date-desc") params.set("sort", sort);
    if (filters.categories[0]) params.set("category", filters.categories[0]);
    if (dateParam) params.set("date", dateParam);
    if (filters.price !== "all") params.set("price", filters.price);
    if (filters.subCity) params.set("city", filters.subCity);
    if (filters.eventTypes[0]) params.set("type", filters.eventTypes[0]);
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedSearch, sort, filters, dateParam, page, pathname, router]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Discover Events"
        description={isLoading ? "Loading events…" : `Showing ${events.length} of ${total} events`}
      />

      {/* Search bar */}
      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search events, organizers, or venues…"
          className="max-w-xl"
        />
      </div>

      <div className="flex gap-8">
        <div className="hidden lg:block">
          <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} categories={categories} />
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
              <option value="featured">Featured</option>
            </select>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)} className="min-h-[44px] rounded-xl font-bold">
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute right-0 top-0 bottom-0 w-[300px] bg-card/95 backdrop-blur-xl p-6 overflow-y-auto shadow-2xl border-l border-border/60"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-lg">Filters</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} categories={categories} />
            <Button
              className="w-full mt-6 min-h-[44px] rounded-xl font-bold"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply Filters
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/** Maps URL date param back to display label */
function formatdateParam(param: string): string | null {
  switch (param) {
    case "today": return "Today";
    case "this-week": return "This Week";
    case "this-month": return "This Month";
    case "upcoming": return "Upcoming";
    default: return null;
  }
}

export default function EventsPage() {
  return (
    <Suspense>
      <EventsContent />
    </Suspense>
  );
}
