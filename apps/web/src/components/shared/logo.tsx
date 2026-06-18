import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeMap = { sm: 32, default: 44, lg: 88 };

export function Logo({ size = "default", className, showText = true }: LogoProps) {
  const px = sizeMap[size];
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-3 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1",
        className
      )}
    >
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {/*
          R4 / W1: Logo asset path switched from /logo.svg (169 KB, no Next
          optimization) to /logo.png (6.2 KB at 176px, 2x the largest
          display size of 88px). Next/Image further optimizes the raster
          into WebP/AVIF variants per-device. /logo.webp is kept as a
          sibling asset for the preload link in app/layout.tsx and any
          non-Next consumer. `priority` keeps this off the lazy queue
          since it sits in the LCP path on every surface that renders it.
        */}
        <Image
          src="/logo.png"
          alt="Eventology Logo"
          width={px}
          height={px}
          className="object-contain drop-shadow-sm"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-display font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary leading-none",
              size === "sm" && "text-base",
              size === "default" && "text-xl",
              size === "lg" && "text-3xl"
            )}
          >
            Eventology
          </span>
          {size !== "sm" && (
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-0.5 block opacity-80 group-hover:text-accent transition-colors">
              Ethiopia
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
