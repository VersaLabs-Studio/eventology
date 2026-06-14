"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Wallet, ArrowDownCircle, Receipt } from "lucide-react";

interface Balance {
  totalEarned: number;
  totalPaidOut: number;
  totalRefunded: number;
  availableBalance: number;
  currency: string;
}

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: currency || "ETB",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function OrganizerRevenuePage() {
  const [balance, setBalance] = React.useState<Balance | null>(null);
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [balanceRes, payoutsRes] = await Promise.all([
          fetch("/api/protected/payouts/balance"),
          fetch("/api/protected/payouts"),
        ]);
        if (!balanceRes.ok || !payoutsRes.ok) {
          throw new Error("Failed to load revenue data");
        }
        const balanceData = await balanceRes.json();
        const payoutsData = await payoutsRes.json();
        setBalance(balanceData);
        setPayouts(Array.isArray(payoutsData.data) ? payoutsData.data : []);
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

  const currency = balance?.currency ?? "ETB";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Revenue & Payouts"
        description="Track earnings, request payouts, and review transaction history."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(balance?.availableBalance ?? 0, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(balance?.totalEarned ?? 0, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Net after platform fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Out
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(balance?.totalPaidOut ?? 0, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Across all payouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refunded
            </CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(balance?.totalRefunded ?? 0, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total reversed</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout history */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No payouts yet. Request your first payout once your balance grows.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Amount</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2 px-2">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-2 font-medium">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            p.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : p.status === "failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {p.completed_at
                          ? new Date(p.completed_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
