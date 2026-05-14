"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: "up" | "down";
  className?: string;
}

export function StatCard({ title, value, change, icon: Icon, trend = "up", className }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-mono font-bold text-3xl text-foreground">{value}</p>
            {change != null && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                trend === "up" ? "text-success" : "text-destructive"
              )}>
                {trend === "up" ? "↑" : "↓"} {Math.abs(change)}%
              </span>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
