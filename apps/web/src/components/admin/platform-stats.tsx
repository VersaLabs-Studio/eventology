"use client";

import * as React from "react";
import { StatCard } from "@/components/shared/stat-card";
import { AreaChartComponent, DonutChartComponent, BarChartComponent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, UserCheck, Building2, TrendingUp, Target } from "lucide-react";

/**
 * Real data shape returned by /api/protected/admin/stats.
 * Mirrors the PlatformStats interface in the route handler.
 */
interface PlatformStatsPayload {
  totalEvents: number;
  totalRegistrations: number;
  activeUsers: number;
  totalOrganizers: number;
  totalRevenue: number;
  currency: string;
  growthRate: number;
  conversionRate: number;
  monthlyGrowth: { label: string; value: number }[];
  categoryDistribution: { label: string; value: number }[];
  subCityDistribution: { label: string; value: number }[];
  dailyActiveUsers: { label: string; value: number }[];
  generatedAt: string;
}

function formatCurrency(amount: number, currency: string): string {
  if (amount === 0) return `${currency} 0.00`;
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: currency || "ETB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PlatformStats() {
  const [stats, setStats] = React.useState<PlatformStatsPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/protected/admin/stats", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load platform stats");
        }
        const data = (await res.json()) as PlatformStatsPayload;
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Events" value={stats.totalEvents} icon={Calendar} />
        <StatCard title="Total Registrations" value={stats.totalRegistrations.toLocaleString()} icon={Users} />
        <StatCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon={UserCheck} />
        <StatCard title="Active Organizers" value={stats.totalOrganizers} icon={Building2} />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue, stats.currency)}
          icon={TrendingUp}
        />
        <StatCard title="Growth (30d)" value={`${stats.growthRate > 0 ? "+" : ""}${stats.growthRate}%`} change={stats.growthRate} icon={Target} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Events Created (last 5 months)</h3>
          <AreaChartComponent data={stats.monthlyGrowth} />
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Events by Category</h3>
          {stats.categoryDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <DonutChartComponent data={stats.categoryDistribution} />
          )}
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Events by Sub-City</h3>
          {stats.subCityDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <BarChartComponent data={stats.subCityDistribution} color="#F97316" />
          )}
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Daily Active (last 7 days)</h3>
          <AreaChartComponent data={stats.dailyActiveUsers} color="#8B5CF6" />
        </div>
      </div>
    </div>
  );
}
