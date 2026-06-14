'use client';

// ============================================================================
// Categories + Venues (public-ish helpers used by event-form)
// ============================================================================
// Wraps /api/public/categories and /api/public/venues. Public RLS
// means any caller can read. Used by the org event form to populate
// the category + venue select dropdowns.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { CategoryKeys, VenueKeys } from '@eventology/config';
import type { Tables } from '@eventology/schemas';

type Category = Tables<'categories'>;
type Venue = Tables<'venues'>;

interface ListResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export function useCategories() {
  return useQuery<ListResponse<Category>>({
    queryKey: CategoryKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/public/categories?limit=100');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useVenues() {
  return useQuery<ListResponse<Venue>>({
    queryKey: VenueKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/public/venues?limit=100');
      if (!res.ok) throw new Error('Failed to fetch venues');
      return res.json();
    },
    staleTime: 60_000,
  });
}
