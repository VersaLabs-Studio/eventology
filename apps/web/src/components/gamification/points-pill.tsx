'use client';

// ============================================================================
// PointsPill — compact points indicator for the navbar (HO-D)
// ============================================================================
// Rendered only for signed-in users; silently renders nothing while loading
// or on error (the header must never block on gamification).
// ============================================================================

import { Trophy } from "lucide-react";
import { useMyGamification } from "@/hooks/use-gamification";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";

export function PointsPill() {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useMyGamification();

  if (!isAuthenticated || isLoading || !data) return null;

  return (
    <span
      className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary/10 text-primary text-xs font-extrabold border border-primary/20 self-start"
      title={t("gamification.points")}
      aria-label={`${data.pointsTotal} ${t("gamification.points")}`}
    >
      <Trophy className="h-3.5 w-3.5" />
      {data.pointsTotal.toLocaleString()}
    </span>
  );
}
