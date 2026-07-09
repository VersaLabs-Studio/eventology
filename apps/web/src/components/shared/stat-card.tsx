"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
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

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
  variant = "org",
  className,
}: StatCardProps) {
  const tint = variant === "admin" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary";

  return (
    <Card
      className={cn(
        "hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-mono font-bold text-3xl text-foreground">{value}</p>
            {change != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  trend === "up" ? "text-success" : "text-destructive"
                )}
              >
                {trend === "up" ? "↑" : "↓"} {Math.abs(change)}%
              </span>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", tint)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
