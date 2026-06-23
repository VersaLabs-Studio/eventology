"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Sparkles, MapPin } from "lucide-react";

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  categoryHint?: string;
  aspectRatio?: "video" | "square" | "wide" | "none";
}

/**
 * Three-tier resilient image pipeline.
 * Tier 1: Original src.
 * Tier 2: Local category SVG placeholder under /images/placeholders/.
 * Tier 3: Premium CSS gradient box — layout never collapses.
 *
 * All tier-2 sources are local static files that work offline.
 */

/** Local placeholder SVGs per category — guaranteed to exist at build time. */
const localFallbacks: Record<string, string> = {
  tech: "/images/placeholders/tech.svg",
  business: "/images/placeholders/business.svg",
  arts: "/images/placeholders/arts.svg",
  health: "/images/placeholders/health.svg",
  education: "/images/placeholders/education.svg",
  music: "/images/placeholders/music.svg",
  food: "/images/placeholders/food.svg",
  community: "/images/placeholders/community.svg",
  default: "/images/placeholders/default.svg",
};

export function FallbackImage({
  src,
  alt,
  categoryHint = "default",
  aspectRatio = "video",
  className,
  ...props
}: FallbackImageProps) {
  // W4: Lazy initializer — honor the same guard as the effect so the
  // initial render never passes an empty string to <img>.
  const [tier, setTier] = React.useState<0 | 1 | 99>(() => {
    if (!src || src.trim() === "") return 1;
    return 0;
  });
  const [currentSrc, setCurrentSrc] = React.useState(() => {
    if (!src || src.trim() === "") {
      return localFallbacks[categoryHint] || localFallbacks.default;
    }
    return src;
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Reset when upstream src changes
  React.useEffect(() => {
    if (!src || src.trim() === "") {
      setCurrentSrc(localFallbacks[categoryHint] || localFallbacks.default);
      setTier(1);
    } else {
      setCurrentSrc(src);
      setTier(0);
    }
    setIsLoading(true);
  }, [src, categoryHint]);

  const handleError = () => {
    if (tier === 0) {
      // Tier 1 failed → switch to local tier-2 placeholder
      setCurrentSrc(localFallbacks[categoryHint] || localFallbacks.default);
      setTier(1);
    } else {
      // Tier 2 also failed → render premium gradient fallback (tier 3)
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

  // ── Tier 3: Premium abstract gradient fallback ──
  if (tier === 99) {
    return (
      <div
        className={cn(
          "relative overflow-hidden w-full rounded-xl flex flex-col items-center justify-center p-6 text-center select-none",
          // Uses brand tokens only — no hardcoded hex
          "bg-gradient-to-br from-secondary/90 via-primary/20 to-primary/80",
          "border border-border/20 shadow-inner",
          aspectClass,
          className
        )}
      >
        {/* Ambient glow blobs */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

        {/* Abstract brand watermark */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <span className="text-9xl font-black tracking-tighter select-none">∞</span>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2 max-w-[90%]">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white shadow-glow animate-pulse">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-display font-bold text-white line-clamp-1">
            {alt || "Eventology"}
          </p>
          <div className="flex items-center gap-3 text-xs text-white/80 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" /> Active
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary-foreground" /> Ethiopia
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Tier 1 / Tier 2: Standard image ──
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
