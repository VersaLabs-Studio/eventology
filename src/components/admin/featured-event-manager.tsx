"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Search, X } from "lucide-react";
import { getFeaturedEvents } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export function FeaturedEventManager() {
  const featuredEvents = getFeaturedEvents();
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-lg mb-4">Currently Featured</h3>
        {featuredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No featured events. Add events to promote them on the homepage.</p>
        ) : (
          <div className="space-y-2">
            {featuredEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="relative h-10 w-16 rounded-md overflow-hidden shrink-0">
                  <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">Since {formatDate(event.createdAt)}</p>
                </div>
                <select className="h-8 rounded-md border border-border bg-background px-2 text-xs">
                  <option>7 days</option>
                  <option>14 days</option>
                  <option>30 days</option>
                </select>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <X className="mr-1 h-3 w-3" /> Unpin
                </Button>
              </div>
            ))}
          </div>
        )}
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
      </div>
    </div>
  );
}
