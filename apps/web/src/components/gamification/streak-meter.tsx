'use client';

// ============================================================================
// StreakMeter — derived attendance streak + next-badge progress (HO-D)
// ============================================================================
// Streak is derived server-side at read (no denormalized counter); this
// component only renders what /api/protected/me/gamification returns.
// ============================================================================

import { motion } from "framer-motion";
import { Flame, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n";
import type { NextBadgeProgress } from "@/hooks/use-gamification";

export function StreakMeter({
  streak,
  nextBadge,
}: {
  streak: number;
  nextBadge: NextBadgeProgress | null;
}) {
  const { t } = useLocale();

  const pct = nextBadge
    ? Math.min(100, Math.round((nextBadge.current / nextBadge.target) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Flame className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-foreground tabular-nums leading-none">
              {streak}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              {t("gamification.streak")}
            </p>
          </div>
        </div>

        {nextBadge && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 justify-end">
              <Target className="h-3 w-3" />
              {t("gamification.nextBadge")}
            </p>
            <p className="text-xs font-bold text-foreground mt-0.5">
              {t("gamification.badgeProgress", {
                current: nextBadge.current,
                target: nextBadge.target,
                code: nextBadge.code,
              })}
            </p>
          </div>
        )}
      </div>

      <Progress value={pct} className="h-1.5" />
    </motion.div>
  );
}
