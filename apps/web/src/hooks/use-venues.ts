'use client';

// ============================================================================
// Venues — Entity-Specific Hooks
// ============================================================================

import { useList, useDoc } from '@/hooks/factory';
import type { ListOptions, ListResponse } from '@/hooks/factory';
import type { Tables } from '@eventology/schemas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VenueRow = Tables<'venues'>;

// ---------------------------------------------------------------------------
// List hook
// ---------------------------------------------------------------------------

export function useVenues(options?: ListOptions) {
  return useList<VenueRow>('venues', options);
}

// ---------------------------------------------------------------------------
// Single document hook
// ---------------------------------------------------------------------------

export function useVenue(id: string | null) {
  return useDoc<VenueRow>('venues', id);
}
