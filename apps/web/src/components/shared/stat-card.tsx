"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Variant = "org" | "admin";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: "up" | "down";
  variant?: Variant;
  className?: string;
}

/**
 * Premium stat card. A tinted gradient wash + an ambient corner glow give it
 * depth; the icon sits in a saturated brand-gradient chip. `variant` swaps the
 * whole treatment between emerald (org) and warm-orange (admin) so the two
 * dashboards read as distinct brands at a glance.
 */
export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
  variant = "org",
  className,
}: StatCardProps) {
  const isAdmin = variant === "admin";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5",
        "shadow-sm transition-all duration-200 hover:shadow-glow hover:-translate-y-0.5",
        className
      )}
    >
      {/* Ambient corner glow — brand-tinted, revealed a touch more on hover */}
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300",
          "opacity-60 group-hover:opacity-100",
          isAdmin ? "bg-accent/20" : "bg-primary/20"
        )}
      />
      {/* Subtle diagonal wash */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-[0.04]",
          isAdmin
            ? "bg-gradient-to-br from-accent to-transparent"
            : "bg-gradient-to-br from-primary to-transparent"
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-mono font-bold text-3xl text-foreground tabular-nums">{value}</p>
          {change != null && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                trend === "up" ? "text-success" : "text-destructive"
              )}
            >
              {trend === "up" ? "↑" : "↓"} {Math.abs(change)}%
            </span>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
            isAdmin
              ? "bg-gradient-to-br from-accent to-[oklch(0.55_0.18_35)]"
              : "bg-gradient-to-br from-primary to-secondary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
