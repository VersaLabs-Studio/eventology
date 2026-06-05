'use client';

// ============================================================================
// Categories — Entity-Specific Hooks
// ============================================================================

import { useList, useDoc } from '@/hooks/factory';
import type { ListOptions, ListResponse } from '@/hooks/factory';
import type { Tables } from '@eventology/schemas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CategoryRow = Tables<'categories'>;

// ---------------------------------------------------------------------------
// List hook
// ---------------------------------------------------------------------------

export function useCategories(options?: ListOptions) {
  return useList<CategoryRow>('categories', { ...options, limit: options?.limit ?? 50 });
}

// ---------------------------------------------------------------------------
// Single document hook
// ---------------------------------------------------------------------------

export function useCategory(id: string | null) {
  return useDoc<CategoryRow>('categories', id);
}
