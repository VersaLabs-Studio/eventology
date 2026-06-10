"use client";

import * as React from "react";
import { StatCard } from "@/components/shared/stat-card";
import { AreaChartComponent, DonutChartComponent, BarChartComponent } from "@/components/ui/chart";
import { platformStats, monthlyGrowth, categoryDistribution, subCityDistribution, dailyActiveUsers } from "@/lib/mock-data";
import { Calendar, Users, UserCheck, Building2, TrendingUp, Target } from "lucide-react";

export function PlatformStats() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Events" value={platformStats.totalEvents} icon={Calendar} />
        <StatCard title="Total Registrations" value={platformStats.totalRegistrations.toLocaleString()} icon={Users} />
        <StatCard title="Active Users" value={platformStats.activeUsers.toLocaleString()} icon={UserCheck} />
        <StatCard title="Active Organizers" value={platformStats.totalOrganizers} icon={Building2} />
        <StatCard title="Growth Rate" value={`${platformStats.growthRate}%`} change={platformStats.growthRate} icon={TrendingUp} />
        <StatCard title="Conversion Rate" value={`${platformStats.conversionRate}%`} icon={Target} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Platform Growth</h3>
          <AreaChartComponent data={monthlyGrowth} />
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Registrations by Category</h3>
          <DonutChartComponent data={categoryDistribution} />
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Events by Sub-City</h3>
          <BarChartComponent data={subCityDistribution} color="#F97316" /> {/* Recharts requires hex */}
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-display font-semibold text-sm mb-4">Daily Active Users</h3>
          <AreaChartComponent data={dailyActiveUsers} color="#8B5CF6" /> {/* Recharts requires hex */}
        </div>
      </div>
    </div>
  );
}
