// ============================================================================
// useProfileStats — read-only profile stats strip (HO-3)
// ============================================================================
// Buckets the caller's registrations (GET /api/protected/registrations?limit=100)
// into Attended / Upcoming / Reviews counts. Reviews are derived from a
// second query (GET /api/protected/reviews — count only). Both are gated on
// an authenticated session; the hook returns zeroed counts while signed out.
//
// Query key ['profile', 'stats'] per the plan. Counts are computed client-side
// from the registration end_date + status, mirroring the web my-events page.

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface RegistrationRow {
  id: string;
  status: 'confirmed' | 'pending_payment' | 'cancelled' | 'checked_in' | 'waitlisted' | 'no_show';
  event: { id: string; title: string; slug: string; end_date: string } | null;
}

interface RegistrationsResponse {
  data: RegistrationRow[];
  meta: { total: number; page: number; limit: number };
}

interface ReviewsResponse {
  data: unknown[];
  meta: { total: number };
}

export interface ProfileStats {
  attended: number;
  upcoming: number;
  reviews: number;
}

async function fetchRegistrations(): Promise<RegistrationsResponse> {
  return api.get<RegistrationsResponse>('/api/protected/registrations?limit=100');
}

async function fetchReviews(): Promise<ReviewsResponse> {
  return api.get<ReviewsResponse>('/api/protected/reviews?limit=1');
}

export function useProfileStats(): {
  stats: ProfileStats;
  isLoading: boolean;
  isError: boolean;
} {
  const { user } = useAuth();

  const regsQ = useQuery({
    queryKey: ['profile', 'stats', 'registrations'],
    queryFn: fetchRegistrations,
    enabled: !!user,
  });

  const reviewsQ = useQuery({
    queryKey: ['profile', 'stats', 'reviews'],
    queryFn: fetchReviews,
    enabled: !!user,
  });

  const now = Date.now();
  const regs = regsQ.data?.data ?? [];

  let attended = 0;
  let upcoming = 0;
  for (const r of regs) {
    if (r.status === 'cancelled' || r.status === 'no_show') continue;
    const ended = r.event ? new Date(r.event.end_date).getTime() < now : false;
    if (ended) attended += 1;
    else upcoming += 1;
  }

  const reviews = reviewsQ.data?.meta?.total ?? 0;

  return {
    stats: { attended, upcoming, reviews },
    isLoading: regsQ.isLoading || reviewsQ.isLoading,
    isError: regsQ.isError || reviewsQ.isError,
  };
}
