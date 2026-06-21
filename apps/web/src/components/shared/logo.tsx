"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

interface LogoProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeMap = { sm: 32, default: 44, lg: 88 };

export function Logo({ size = "default", className, showText = true }: LogoProps) {
  const px = sizeMap[size];
  // R5: Brand text localized via the standing i18n rule. The Logo renders
  // inside the Navbar (header + mobile drawer), the Footer, and both auth
  // pages — i.e. every chrome surface — so the hardcoded English was the
  // last visible i18n gap on rot4's public sweep. Made "use client" (same
  // pattern as Footer in rot4) to call useLocale().
  const { t } = useLocale();

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
          alt={t("common.appName") + " Logo"}
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
            {t("common.appName")}
          </span>
          {size !== "sm" && (
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-0.5 block opacity-80 group-hover:text-accent transition-colors">
              {t("common.region")}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}