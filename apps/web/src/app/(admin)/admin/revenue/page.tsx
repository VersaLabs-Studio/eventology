"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, Banknote, RotateCcw, Clock } from "lucide-react";

interface PlatformRevenue {
  gmv: number;
  platformFees: number;
  totalRefunded: number;
  outstandingPayouts: number;
  completedPayments: number;
  refundedPayments: number;
  currency: string;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: currency || "ETB",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function AdminRevenuePage() {
  const [revenue, setRevenue] = React.useState<PlatformRevenue | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/protected/admin/revenue");
        if (!res.ok) {
          throw new Error("Failed to load revenue data");
        }
        const data = await res.json();
        setRevenue(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const currency = revenue?.currency ?? "ETB";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Platform Revenue"
        description="Aggregate financial metrics across all organizers and events."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GMV
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(revenue?.gmv ?? 0, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {revenue?.completedPayments ?? 0} completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform Fees
            </CardTitle>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(revenue?.platformFees ?? 0, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Commission earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refunded
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(revenue?.totalRefunded ?? 0, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {revenue?.refundedPayments ?? 0} refund events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Payouts
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(revenue?.outstandingPayouts ?? 0, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Pending or processing</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
