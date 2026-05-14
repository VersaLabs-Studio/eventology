"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin } from "lucide-react";
import { cn, formatDate, formatCurrency, getInitials } from "@/lib/utils";
import type { Event } from "@/lib/types";
import { motion } from "framer-motion";

interface EventCardProps {
  event: Event;
  variant?: "grid" | "horizontal" | "featured";
  className?: string;
}

export function EventCard({ event, variant = "grid", className }: EventCardProps) {
  if (variant === "horizontal") {
    return (
      <Link href={`/events/${event.slug}`}>
        <Card hoverable className={cn("flex flex-row overflow-hidden", className)}>
          <div className="relative w-48 shrink-0">
            <Image
              src={event.bannerImage}
              alt={event.title}
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>
          <CardContent className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">{event.category.name}</Badge>
                {event.isFeatured && <Badge variant="accent">Featured</Badge>}
              </div>
              <h3 className="font-display font-semibold text-base line-clamp-1">{event.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.shortDescription}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.date)}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {event.ticketType === "free" ? "Free" : `From ${formatCurrency(event.ticketTiers[0].price)}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/events/${event.slug}`}>
        <motion.div
          whileHover={{ y: -4 }}
          className={cn("relative rounded-xl overflow-hidden group cursor-pointer w-[400px] shrink-0", className)}
        >
          <div className="relative h-[300px]">
            <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="400px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{event.category.name}</Badge>
              {event.isFeatured && <Badge variant="accent">Featured</Badge>}
            </div>
            <h3 className="font-display font-semibold text-xl">{event.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/70">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.slug}`}>
      <Card hoverable className={cn("overflow-hidden", className)}>
        <div className="relative aspect-video">
          <Image src={event.bannerImage} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">{event.category.name}</Badge>
          </div>
          {event.isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge variant="accent">Featured</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-display font-semibold text-base line-clamp-1">{event.title}</h3>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={event.organizer.avatar} />
                <AvatarFallback className="text-[10px]">{getInitials(event.organizer.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">{event.organizer.name}</span>
            </div>
            <span className="text-sm font-semibold text-primary">
              {event.ticketType === "free" ? "Free" : `ETB ${event.ticketTiers[0].price.toLocaleString()}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
