'use client';

// ============================================================================
// Referral — Entity-Specific Hooks (HO-E)
// ============================================================================
// Reads only: codes are auto-created server-side, redemptions are
// system-written via SECURITY DEFINER functions — there are no mutations.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { ReferralKeys } from '@eventology/config';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MyReferral {
  code: string;
  inviteUrl: string;
  /** People who signed up with my code. */
  signups: number;
  /** Signups who attended their first event (rewarded). */
  qualified: number;
}

export interface LeaderboardEntry {
  rank: number;
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  qualified_count: number;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function useMyReferral() {
  return useQuery<MyReferral>({
    queryKey: ReferralKeys.me(),
    queryFn: async () => {
      const res = await fetch('/api/protected/me/referral');
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load referral');
      }
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useReferralLeaderboard(limit = 10) {
  return useQuery<{ data: LeaderboardEntry[] }>({
    queryKey: ReferralKeys.leaderboard(),
    queryFn: async () => {
      const res = await fetch(`/api/protected/me/referral/leaderboard?limit=${limit}`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load leaderboard');
      }
      return res.json();
    },
    staleTime: 60_000,
  });
}
