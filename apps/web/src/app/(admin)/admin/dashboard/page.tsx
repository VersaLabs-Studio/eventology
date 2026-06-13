"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { PlatformStats } from "@/components/admin/platform-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Star, BadgeCheck, ScrollText, ArrowRight, Sparkles, Activity, AlertOctagon, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface QuickAction {
  label: string;
  href: string;
  icon: typeof ShieldCheck;
  desc: string;
}

interface AIHealth {
  ok: boolean;
  data: {
    summary?: string;
    recommendations?: string[];
  } | null;
  snapshot?: {
    total_events: number;
    active_events: number;
    total_users: number;
    new_users_period: number;
    total_registrations: number;
    revenue_period: number;
    pending_moderations: number;
    flagged_content: number;
  };
}

async function fetchAIHealth(): Promise<AIHealth> {
  const res = await fetch("/api/protected/admin/ai/health", {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, data: null };
  return res.json();
}

async function fetchAIFraudCount(): Promise<{ open: number }> {
  const res = await fetch("/api/protected/admin/ai/fraud", { cache: "no-store" });
  if (!res.ok) return { open: 0 };
  const data = (await res.json() as { data: Array<unknown> });
  return { open: data.data?.length ?? 0 };
}

export default function AdminDashboardPage() {
  const healthQ = useQuery({ queryKey: ["admin", "ai", "health"], queryFn: fetchAIHealth, staleTime: 60_000 });
  const fraudQ = useQuery({ queryKey: ["admin", "ai", "fraud-count"], queryFn: fetchAIFraudCount, staleTime: 15_000 });

  const quickActions: QuickAction[] = [
    { label: "Review Pending Events", href: "/admin/moderation", icon: ShieldCheck, desc: "Events awaiting approval" },
    { label: "Verify Organizers", href: "/admin/organizers", icon: BadgeCheck, desc: "Organizer applications pending" },
    { label: "Manage Featured", href: "/admin/featured", icon: Star, desc: "Curate homepage featured events" },
    { label: "View Audit Log", href: "/admin/audit-log", icon: ScrollText, desc: "Review all admin actions" },
  ];

  const snapshot = healthQ.data?.snapshot;
  const aiSummary = healthQ.data?.data?.summary;
  const aiRecs = healthQ.data?.data?.recommendations ?? [];
  const fraudCount = fraudQ.data?.open ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader title="Admin Dashboard" description="Platform analytics and management" />
      <PlatformStats />

      {/* AI Health & Fraud at-a-glance (advisory — Day 14 surfaces) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Platform Health (AI)
            </CardTitle>
            <Sparkles className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {healthQ.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : !aiSummary ? (
              <p className="text-sm text-muted-foreground">
                AI summary unavailable. Configure <code>OPENROUTER_API_KEY</code> + <code>AI_MODEL_CHAIN</code> to enable live narratives.
              </p>
            ) : (
              <>
                <p className="text-sm text-foreground leading-relaxed">{aiSummary}</p>
                {aiRecs.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {aiRecs.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-accent">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
                {snapshot && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-muted/50 p-2">
                      <div className="text-muted-foreground">Pending mod.</div>
                      <div className="font-semibold">{snapshot.pending_moderations}</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <div className="text-muted-foreground">Flagged</div>
                      <div className="font-semibold">{snapshot.flagged_content}</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <div className="text-muted-foreground">New users (30d)</div>
                      <div className="font-semibold">{snapshot.new_users_period}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-destructive" /> Open Fraud Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fraudQ.isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">{fraudCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {fraudCount === 0
                    ? "No open fraud signals."
                    : "Signals are advisory — review and dismiss in the moderation queue."}
                </p>
                <Link
                  href="/admin/moderation"
                  className="mt-3 inline-flex items-center text-xs text-primary hover:underline"
                >
                  Open queue <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="font-display font-semibold text-lg mt-8 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card hoverable className="h-full">
                <CardContent className="p-5">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                    <action.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h4 className="font-display font-semibold text-sm">{action.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
