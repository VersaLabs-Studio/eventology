'use client';

// ============================================================================
// ReferralLeaderboard — top referrers by qualified count (HO-E)
// ============================================================================
// Served by fn_referral_leaderboard (rank/name/qualified count only — the
// redemptions table itself stays involved-visible). Hides when empty.
// ============================================================================

import { motion } from "framer-motion";
import { Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReferralLeaderboard } from "@/hooks/use-referral";
import { useLocale } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";

const rankStyles = ["text-accent", "text-foreground", "text-primary"];

export function ReferralLeaderboard({ limit = 10 }: { limit?: number }) {
  const { t } = useLocale();
  const { data, isLoading } = useReferralLeaderboard(limit);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  const entries = data?.data ?? [];
  if (entries.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Medal className="h-4 w-4 text-accent" />
            {t("referral.leaderboard")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.profile_id}
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-2"
            >
              <span
                className={`w-6 text-center text-sm font-black tabular-nums ${rankStyles[entry.rank - 1] ?? "text-muted-foreground"}`}
                aria-label={`#${entry.rank}`}
              >
                {entry.rank}
              </span>
              <Avatar size="sm">
                {entry.avatar_url ? <AvatarImage src={entry.avatar_url} alt="" /> : null}
                <AvatarFallback className="text-[10px]">
                  {getInitials(entry.full_name)}
                </AvatarFallback>
              </Avatar>
              <p className="flex-1 min-w-0 truncate text-sm font-bold text-foreground">
                {entry.full_name}
              </p>
              <p className="text-xs font-extrabold text-success tabular-nums">
                {entry.qualified_count} {t("referral.qualifiedShort")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
