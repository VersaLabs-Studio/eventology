"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, Sparkles } from "lucide-react";

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  categoryHint?: string;
  aspectRatio?: "video" | "square" | "wide" | "none";
}

// Highly reliable backup image URLs curated per general category
const backupSources: Record<string, string[]> = {
  default: [
    "https://images.unsplash.com/photo-1511678652744-4b1b4c1b3b2a?w=800&h=500&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492680515-9b1b4c1b3b2a?w=800&h=500&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505375081540-2a25c2d9d1e4?w=800&h=500&fit=crop&q=80",
  ],
};

export function FallbackImage({
  src,
  alt,
  categoryHint = "default",
  aspectRatio = "video",
  className,
  ...props
}: FallbackImageProps) {
  const [tier, setTier] = React.useState<number>(0);
  const [currentSrc, setCurrentSrc] = React.useState<string>(src);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // If initial src changes from upstream props, reset state
  React.useEffect(() => {
    setCurrentSrc(src);
    setTier(0);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    const nextTier = tier + 1;
    const backups = backupSources[categoryHint] || backupSources.default;
    
    if (nextTier <= backups.length) {
      // Tier 1 & 2 Fallback: switch to alternative highly reliable curated links
      setTier(nextTier);
      setCurrentSrc(backups[nextTier - 1]);
    } else {
      // Tier 3 Ultimate Fallback: Render premium abstract brand CSS banner
      setTier(99); 
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const aspectClass = cn(
    aspectRatio === "video" && "aspect-video",
    aspectRatio === "square" && "aspect-square",
    aspectRatio === "wide" && "aspect-[21/9]",
    aspectRatio === "none" && ""
  );

  // Render Ultimate Premium Fallback View if all remote attempts fail
  if (tier === 99) {
    return (
      <div
        className={cn(
          "relative overflow-hidden w-full rounded-xl bg-gradient-to-br from-secondary/90 via-card-dark to-primary/80 flex flex-col items-center justify-center p-6 text-center select-none shadow-inner border border-white/10",
          aspectClass,
          className
        )}
      >
        {/* Subtle decorative glowing backdrops */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Abstract brand line graphics representing Eventology */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <span className="text-9xl font-black tracking-tighter">♾️</span>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2 max-w-[90%]">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white shadow-glow animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-display font-bold text-white line-clamp-1">
            {alt || "Eventology Discovery"}
          </p>
          <div className="flex items-center gap-3 text-xs text-white/80 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-accent" /> Live
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary-foreground" /> Addis Ababa
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden w-full bg-muted/30 rounded-xl", aspectClass, className)}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          isLoading ? "scale-105 blur-sm opacity-0" : "scale-100 blur-0 opacity-100"
        )}
        {...props}
      />
    </div>
  );
}
