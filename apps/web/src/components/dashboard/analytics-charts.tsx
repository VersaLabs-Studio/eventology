"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChartComponent, BarChartComponent, DonutChartComponent } from "@/components/ui/chart";

interface AnalyticsChartsProps {
  data: {
    registrationsOverTime: { label: string; value: number }[];
    viewsOverTime: { label: string; value: number }[];
    tierDistribution: { label: string; value: number }[];
    subCityDistribution: { label: string; value: number }[];
  };
}

/**
 * R2: charts now consume live data from the analytics endpoint.
 * Recharts requires hex colors; the chart component handles that.
 */
export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {data.viewsOverTime.length > 0 ? (
            <AreaChartComponent data={data.viewsOverTime} color="#065F46" />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Registration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data.registrationsOverTime.length > 0 ? (
            <BarChartComponent data={data.registrationsOverTime} color="#84CC16" />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ticket Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {data.tierDistribution.length > 0 ? (
            <DonutChartComponent data={data.tierDistribution.slice(0, 4)} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No tier data yet</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Registrations by Sub-City</CardTitle>
        </CardHeader>
        <CardContent>
          {data.subCityDistribution.length > 0 ? (
            <BarChartComponent data={data.subCityDistribution} color="#F97316" />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No sub-city data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
