"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw } from "lucide-react";
import type { Category } from "@/lib/types";

const subCities = ["Bole", "Arada", "Kirkos", "Lideta", "Yeka", "Kolfe Keranio", "Nifas Silk-Lafto", "Addis Ketema", "Akaki Kality", "Gulele"];
const eventTypes = ["conference", "workshop", "meetup", "seminar", "networking", "concert", "exhibition", "training"];

export interface FilterState {
  categories: string[];
  dateRange: string | null;
  subCity: string | null;
  price: "all" | "free" | "paid";
  eventTypes: string[];
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories?: Category[];
  className?: string;
}

export function FilterSidebar({ filters, onChange, categories = [], className }: FilterSidebarProps) {
  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleCategory = (slug: string) => {
    const next = filters.categories.includes(slug)
      ? filters.categories.filter((c) => c !== slug)
      : [...filters.categories, slug];
    update({ categories: next });
  };

  const toggleEventType = (type: string) => {
    const next = filters.eventTypes.includes(type)
      ? filters.eventTypes.filter((t) => t !== type)
      : [...filters.eventTypes, type];
    update({ eventTypes: next });
  };

  const clearAll = () => {
    onChange({ categories: [], dateRange: null, subCity: null, price: "all", eventTypes: [] });
  };

  return (
    <aside className={cn("w-[280px] shrink-0 space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">Filters</h3>
        <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          <RotateCcw className="h-3 w-3" /> Clear All
        </button>
      </div>

      <Separator />

      {categories.length > 0 && (
        <>
          <div>
            <h4 className="text-sm font-medium mb-3">Categories</h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Checkbox checked={filters.categories.includes(cat.slug)} onCheckedChange={() => toggleCategory(cat.slug)} />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div>
        <h4 className="text-sm font-medium mb-3">Date Range</h4>
        <div className="flex flex-wrap gap-2">
          {["Today", "This Week", "This Month", "Upcoming"].map((range) => (
            <button
              key={range}
              onClick={() => update({ dateRange: filters.dateRange === range ? null : range })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filters.dateRange === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-medium mb-3">Sub-City</h4>
        <select
          value={filters.subCity || ""}
          onChange={(e) => update({ subCity: e.target.value || null })}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Sub-Cities</option>
          {subCities.map((sc) => (
            <option key={sc} value={sc}>{sc}</option>
          ))}
        </select>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-medium mb-3">Price</h4>
        <div className="flex gap-2">
          {(["all", "free", "paid"] as const).map((p) => (
            <button
              key={p}
              onClick={() => update({ price: p })}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                filters.price === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-medium mb-3">Event Type</h4>
        <div className="space-y-2">
          {eventTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors capitalize">
              <Checkbox checked={filters.eventTypes.includes(type)} onCheckedChange={() => toggleEventType(type)} />
              {type}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
