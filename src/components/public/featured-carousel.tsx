"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { getFeaturedEvents } from "@/lib/mock-data";
import { EventCard } from "@/components/shared/event-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function FeaturedCarousel() {
  const events = getFeaturedEvents();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 420;
    scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="snap-start"
          >
            <EventCard event={event} variant="featured" />
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
