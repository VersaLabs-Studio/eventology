"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, Banknote, RotateCcw, Hourglass } from "lucide-react";

/**
 * R3 / A1 — Payments-off placeholder.
 *
 * Replaces the live platform-revenue surface while the MVP ships with
 * `NEXT_PUBLIC_PAYMENTS_ENABLED=false`. The underlying admin/revenue API
 * route is intentionally left untouched so the flag flip restores the
 * live metrics with zero code changes.
 */
export default function AdminRevenuePage() {
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

      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto">
            <Clock className="h-6 w-6 text-accent" />
          </div>
          <h2 className="font-display font-bold text-xl">Payments coming soon</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Platform-wide GMV, commission, and refund metrics are paused during
            the MVP. They will return here automatically the moment payments
            are enabled.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl mx-auto">
            {[
              { icon: DollarSign, label: "GMV" },
              { icon: Banknote, label: "Platform Fees" },
              { icon: RotateCcw, label: "Refunded" },
              { icon: Hourglass, label: "Outstanding Payouts" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-xl border border-dashed border-border/60 p-3 text-center"
              >
                <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="text-sm font-semibold text-muted-foreground mt-1">—</p>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Link href="/admin/dashboard">
              <Button variant="outline" className="min-h-[44px] rounded-xl font-bold">
                Back to dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
