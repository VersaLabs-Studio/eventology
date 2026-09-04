'use client';

// ============================================================================
// Gamification — Entity-Specific Hooks (HO-D)
// ============================================================================
// Reads only: badges/points are system-written (fn_award_badge), so there are
// no mutations. `useMyGamification` drives the profile trophy case + points
// pill; `useUserBadges` serves future public user pages.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { GamificationKeys } from '@eventology/config';
import type { EarnedBadge } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NextBadgeProgress {
  code: string;
  target: number;
  current: number;
}

export interface GamificationProfile {
  pointsTotal: number;
  badges: EarnedBadge[];
  /** Derived at read: total attended events (streak_5 semantics). */
  streak: number;
  nextBadge: NextBadgeProgress | null;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function useMyGamification() {
  return useQuery<GamificationProfile>({
    queryKey: GamificationKeys.me(),
    queryFn: async () => {
      const res = await fetch('/api/protected/me/gamification');
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load gamification');
      }
      return res.json();
    },
    staleTime: 60_000,
  });
}

export interface PublicTrophyCase {
  data: EarnedBadge[];
  pointsTotal: number;
}

export function useUserBadges(userId: string | null) {
  return useQuery<PublicTrophyCase>({
    queryKey: GamificationKeys.byUser(userId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/public/users/${userId}/badges`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load badges');
      }
      return res.json();
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}
