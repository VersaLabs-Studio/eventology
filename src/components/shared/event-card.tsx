"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin } from "lucide-react";
import { cn, formatDate, formatCurrency, getInitials } from "@/lib/utils";
import type { Event } from "@/lib/types";
import { motion } from "framer-motion";
import { FallbackImage } from "./fallback-image";

interface EventCardProps {
  event: Event;
  variant?: "grid" | "horizontal" | "featured";
  className?: string;
}

export function EventCard({ event, variant = "grid", className }: EventCardProps) {
  if (variant === "horizontal") {
    return (
      <Link href={`/events/${event.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        <Card hoverable className={cn("flex flex-row overflow-hidden h-44", className)}>
          <div className="relative w-48 shrink-0 flex items-stretch">
            <FallbackImage
              src={event.bannerImage}
              alt={event.title}
              categoryHint={event.category?.slug || "default"}
              aspectRatio="none"
              className="w-full h-full rounded-r-none"
            />
          </div>
          <CardContent className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px]">{event.category.name}</Badge>
                {event.isFeatured && <Badge variant="accent" className="text-[10px]">Featured</Badge>}
              </div>
              <h3 className="font-display font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{event.shortDescription}</p>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-3 text-xs text-muted-foreground truncate">
                <span className="flex items-center gap-1 shrink-0"><Calendar className="h-3 w-3 text-primary" />{formatDate(event.date)}</span>
                <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 text-accent shrink-0" /><span className="truncate">{event.location}</span></span>
              </div>
              <span className="text-xs font-extrabold text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded">
                {event.ticketType === "free" ? "Free" : `From ${formatCurrency(event.ticketTiers[0]?.price || 0)}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/events/${event.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className={cn("relative rounded-2xl overflow-hidden group cursor-pointer w-[380px] sm:w-[420px] shrink-0 shadow-lg border border-border/40", className)}
        >
          <div className="relative h-[320px] w-full flex items-stretch">
            <FallbackImage 
              src={event.bannerImage} 
              alt={event.title} 
              categoryHint={event.category?.slug || "default"}
              aspectRatio="none"
              className="absolute inset-0 w-full h-full rounded-none" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-secondary/90 text-white backdrop-blur-md border-none">{event.category.name}</Badge>
              {event.isFeatured && <Badge variant="accent" className="shadow-accent-glow animate-pulse border-none">Featured</Badge>}
            </div>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight leading-tight group-hover:text-primary transition-colors">{event.title}</h3>
            <div className="flex items-center gap-4 mt-3 text-xs sm:text-sm text-white/80 font-medium">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1.5 truncate"><MapPin className="h-4 w-4 text-accent shrink-0" /><span className="truncate">{event.location}</span></span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl group">
      <Card hoverable className={cn("overflow-hidden flex flex-col h-full border-border/60 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-xl", className)}>
        <div className="relative aspect-video w-full shrink-0">
          <FallbackImage 
            src={event.bannerImage} 
            alt={event.title} 
            categoryHint={event.category?.slug || "default"}
            aspectRatio="video"
            className="w-full h-full rounded-b-none" 
          />
          <div className="absolute top-3 left-3 z-20">
            <Badge variant="secondary" className="shadow-sm backdrop-blur-md bg-secondary/90 text-white border-none font-medium">{event.category.name}</Badge>
          </div>
          {event.isFeatured && (
            <div className="absolute top-3 right-3 z-20">
              <Badge variant="accent" className="shadow-accent-glow animate-pulse border-none font-bold">Featured</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{event.title}</h3>
            <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground font-medium">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium">
              <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 ring-1 ring-border">
                <AvatarImage src={event.organizer?.avatar} />
                <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">{getInitials(event.organizer?.name || "Org")}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground font-medium truncate max-w-[100px]">{event.organizer?.name}</span>
            </div>
            <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-1 rounded">
              {event.ticketType === "free" ? "Free" : `ETB ${(event.ticketTiers[0]?.price || 0).toLocaleString()}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

