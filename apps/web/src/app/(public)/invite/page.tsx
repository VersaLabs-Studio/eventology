"use client";

// ============================================================================
// /invite — share hub: my code, copy/native share, stats + leaderboard (HO-E)
// ============================================================================
// Signed-in gated (the protected endpoints 401 otherwise). Golden template:
// (public)/feed/page.tsx (signed-in gated page) + my-events page shape.
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferralCard } from "@/components/referral/referral-card";
import { ReferralLeaderboard } from "@/components/referral/referral-leaderboard";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";
import { Gift } from "lucide-react";

export default function InvitePage() {
  const { t } = useLocale();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader title={t("referral.inviteTitle")} description={t("referral.description")} />
          <EmptyState
            icon={Gift}
            title={t("referral.signInTitle")}
            description={t("referral.signInBody")}
            action={{ label: t("nav.login"), onClick: () => (window.location.href = "/auth/login") }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title={t("referral.inviteTitle")} description={t("referral.inviteDesc")} />

        <div className="space-y-6">
          <ReferralCard />
          <ReferralLeaderboard />
        </div>
      </motion.div>
    </div>
  );
}
