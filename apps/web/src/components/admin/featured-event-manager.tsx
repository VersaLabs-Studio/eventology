"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Search, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface FeaturedEvent {
  id: string;
  slug: string;
  title: string;
  banner_image: string | null;
  is_featured: boolean;
  featured_until: string | null;
  status: string;
  start_date: string;
  organizer: { id: string; name: string } | null;
  category: { id: string; name: string; color: string } | null;
}

const FEATURED_KEY = ["admin", "featured"] as const;
const SEARCH_KEY = ["admin", "featured", "search"] as const;

interface SearchEvent {
  id: string;
  slug: string;
  title: string;
  banner_image: string | null;
  start_date: string;
  organizer: { id: string; name: string } | null;
  category: { id: string; name: string; color: string } | null;
}

async function fetchFeatured(): Promise<{ data: FeaturedEvent[] }> {
  const res = await fetch("/api/protected/admin/featured", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load featured events");
  return res.json();
}

async function searchEvents(query: string): Promise<{ data: SearchEvent[] }> {
  const res = await fetch(`/api/public/events?search=${encodeURIComponent(query)}&limit=10`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to search events");
  return res.json();
}

async function featureEvent(input: { event_id: string; duration: "7_days" | "14_days" | "30_days" }): Promise<FeaturedEvent> {
  const res = await fetch("/api/protected/admin/featured", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to feature event");
  }
  return res.json();
}

async function unfeatureEvent(id: string): Promise<FeaturedEvent> {
  const res = await fetch(`/api/protected/admin/featured?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Failed to unfeature event");
  }
  return res.json();
}

export function FeaturedEventManager() {
  const qc = useQueryClient();
  const featuredQ = useQuery({ queryKey: FEATURED_KEY, queryFn: fetchFeatured });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDuration, setSelectedDuration] = React.useState<Record<string, "7_days" | "14_days" | "30_days">>({});
  const searchQ = useQuery({
    queryKey: [...SEARCH_KEY, searchQuery],
    queryFn: () => searchEvents(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 10_000,
  });

  const feature = useMutation({
    mutationFn: featureEvent,
    onSuccess: () => {
      toast.success("Event featured");
      qc.invalidateQueries({ queryKey: FEATURED_KEY });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to feature"),
  });

  const unfeature = useMutation({
    mutationFn: unfeatureEvent,
    onSuccess: () => {
      toast("Event unfeatured");
      qc.invalidateQueries({ queryKey: FEATURED_KEY });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to unfeature"),
  });

  const featured = featuredQ.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-lg mb-4">Currently Featured</h3>
        {featuredQ.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}
        {!featuredQ.isLoading && featured.length === 0 && (
          <p className="text-sm text-muted-foreground">No featured events. Add events below to promote them on the homepage.</p>
        )}
        <div className="space-y-2">
          {featured.map((event) => {
            const dur = selectedDuration[event.id] ?? "7_days";
            return (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="relative h-10 w-16 rounded-md overflow-hidden shrink-0 bg-muted">
                  {event.banner_image && (
                    <Image src={event.banner_image} alt={event.title} fill className="object-cover" sizes="64px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.featured_until ? `Until ${formatDate(event.featured_until)}` : "No expiry"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => unfeature.mutate(event.id)}
                  disabled={unfeature.isPending}
                >
                  <X className="mr-1 h-3 w-3" /> Unpin
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-lg mb-4">Add to Featured</h3>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery.length >= 2 && (
          <div className="mt-3 space-y-2">
            {searchQ.isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}
            {searchQ.data?.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No matching events.</p>
            )}
            {searchQ.data?.data?.map((event) => {
              const dur = selectedDuration[event.id] ?? "7_days";
              return (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="relative h-10 w-16 rounded-md overflow-hidden shrink-0 bg-muted">
                    {event.banner_image && (
                      <Image src={event.banner_image} alt={event.title} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.organizer?.name ?? "—"}
                    </p>
                  </div>
                  <select
                    value={dur}
                    onChange={(e) =>
                      setSelectedDuration((s) => ({ ...s, [event.id]: e.target.value as "7_days" | "14_days" | "30_days" }))
                    }
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="7_days">7 days</option>
                    <option value="14_days">14 days</option>
                    <option value="30_days">30 days</option>
                  </select>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={feature.isPending}
                    onClick={() => feature.mutate({ event_id: event.id, duration: dur })}
                  >
                    Pin
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
