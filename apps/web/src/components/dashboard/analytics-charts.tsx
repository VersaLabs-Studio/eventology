"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChartComponent, BarChartComponent, DonutChartComponent } from "@/components/ui/chart";
import { viewsOverTime, registrationTrends, categoryDistribution, subCityDistribution } from "@/lib/mock-data";

export function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChartComponent data={viewsOverTime} color="#065F46" /> {/* Recharts requires hex */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Registration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartComponent data={registrationTrends} color="#84CC16" /> {/* Recharts requires hex */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ticket Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutChartComponent data={categoryDistribution.slice(0, 4)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Registrations by Sub-City</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartComponent data={subCityDistribution} color="#F97316" /> {/* Recharts requires hex */}
        </CardContent>
      </Card>
    </div>
  );
}
