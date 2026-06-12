"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { EventCard } from "@/components/shared/event-card";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { AISearchPanel } from "@/components/ai/ai-search-panel";
import { searchEvents } from "@/lib/mock-data";
import { Search, Lightbulb } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = React.useState(q);
  const [results, setResults] = React.useState(q ? searchEvents(q) : []);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setResults(searchEvents(val));
    } else {
      setResults([]);
    }
  };

  const handleApplyFilters = (filters: {
    categories?: string[];
    event_types?: string[];
    locations?: string[];
    tags?: string[];
  }) => {
    // Augment the query with the interpreted categories + types so the
    // keyword search picks them up. V2 could push them into URL params
    // and re-query the API; V1 keeps the mock search happy.
    const parts: string[] = [query];
    if (filters.categories?.length) parts.push(filters.categories.join(" "));
    if (filters.event_types?.length) parts.push(filters.event_types.join(" "));
    if (filters.locations?.length) parts.push(filters.locations.join(" "));
    const newQuery = parts.join(" ").trim();
    if (newQuery !== query) {
      setQuery(newQuery);
      setResults(searchEvents(newQuery));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Search Results" />
      <div className="mb-6">
        <SearchBar
          variant="compact"
          placeholder="Search events, organizers, or venues..."
          value={query}
          onChange={handleSearch}
          className="max-w-xl"
        />
      </div>

      <AISearchPanel query={query} onApply={handleApplyFilters} />

      {query && (
        <p className="text-sm text-muted-foreground mb-6">
          {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      )}

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <EventCard event={event} variant="horizontal" />
            </motion.div>
          ))}
        </div>
      ) : query ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`We couldn't find any events matching "${query}". Try searching for 'conference', 'workshop', or 'music'.`}
        />
      ) : (
        <EmptyState
          icon={Lightbulb}
          title="Search for events"
          description="Try searching for 'conference', 'workshop', or 'music'"
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
