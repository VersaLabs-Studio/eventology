import * as React from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapEmbedProps {
  location: string;
  coordinates: { lat: number; lng: number };
  className?: string;
}

export function MapEmbed({ location, coordinates, className }: MapEmbedProps) {
  const mapsUrl = `https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`;

  return (
    <div className={cn("bg-muted rounded-xl overflow-hidden", className)}>
      <div className="h-40 flex flex-col items-center justify-center gap-2">
        <MapPin className="h-8 w-8 text-primary" />
        <p className="text-sm font-medium text-center">{location}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          View on Google Maps
        </a>
      </div>
    </div>
  );
}
