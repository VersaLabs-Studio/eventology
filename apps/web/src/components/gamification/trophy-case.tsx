'use client';

// ============================================================================
// TrophyCase — earned badges + points (HO-D)
// ============================================================================
// Own profile view (me/gamification: progress + streak) when no userId is
// given; public trophy-case view (/api/public/users/[id]/badges) when one is.
// Badge icons come from the catalog `icon` field (lucide keys from the seed).
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { Award, Compass, Crown, Flame, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyGamification, useUserBadges } from "@/hooks/use-gamification";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";
import { StreakMeter } from "./streak-meter";
import type { EarnedBadge } from "@eventology/schemas";

const iconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  flame: Flame,
  compass: Compass,
  crown: Crown,
};

// Tier → semantic token classes (no hardcoded colors).
const tierStyles: Record<string, string> = {
  gold: "bg-accent/10 text-accent border-accent/20",
  silver: "bg-foreground/5 text-foreground border-border",
  bronze: "bg-muted text-muted-foreground border-border",
};

function BadgeTile({ earned }: { earned: EarnedBadge }) {
  const Icon = iconMap[earned.badge.icon] ?? Award;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center ${tierStyles[earned.badge.tier] ?? tierStyles.bronze}`}
      title={earned.badge.description}
    >
      <Icon className="h-6 w-6" />
      <p className="text-[11px] font-extrabold leading-tight">{earned.badge.name}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">
        {earned.badge.tier} · {earned.badge.points}
      </p>
    </motion.div>
  );
}

export function TrophyCase({ userId }: { userId?: string }) {
  const { t } = useLocale();
  const { user } = useAuth();

  // Public view for a specific user; me-view (richer) otherwise.
  const publicCase = useUserBadges(userId ?? null);
  const me = useMyGamification();
  const isMe = !userId || userId === user?.id;

  const loading = isMe ? me.isLoading : publicCase.isLoading;
  const badges = isMe ? (me.data?.badges ?? []) : (publicCase.data?.data ?? []);
  const points = isMe ? (me.data?.pointsTotal ?? 0) : (publicCase.data?.pointsTotal ?? 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {t("gamification.trophyCase")}
        </CardTitle>
        <CardDescription>
          {t("gamification.pointsEarned", { count: points })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {isMe && me.data && (
              <StreakMeter streak={me.data.streak} nextBadge={me.data.nextBadge} />
            )}

            {badges.length === 0 ? (
              <div className="text-center py-6 rounded-xl bg-muted/30 border border-border/40">
                <Award className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">{t("gamification.noBadges")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {badges.map((b) => (
                  <BadgeTile key={b.id} earned={b} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
