"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { PlatformStats } from "@/components/admin/platform-stats";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Star, BadgeCheck, ScrollText, ArrowRight } from "lucide-react";

const quickActions = [
  { label: "Review Pending Events (3)", href: "/admin/moderation", icon: ShieldCheck, desc: "Events awaiting approval" },
  { label: "Verify Organizers (2)", href: "/admin/organizers", icon: BadgeCheck, desc: "Organizer applications pending" },
  { label: "Manage Featured", href: "/admin/featured", icon: Star, desc: "Curate homepage featured events" },
  { label: "View Audit Log", href: "/admin/audit-log", icon: ScrollText, desc: "Review all admin actions" },
];

export default function AdminDashboardPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Admin Dashboard" description="Platform analytics and management" />
      <PlatformStats />

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
    </motion.div>
  );
}
