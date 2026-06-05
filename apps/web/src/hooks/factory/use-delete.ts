'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import { QUERY_KEY_MAP } from './query-key-map';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Generic delete mutation
// ---------------------------------------------------------------------------

/**
 * Deletes an entity by ID via the protected API route.
 * Invalidates all list queries for the entity on success.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 */
export function useDelete(entity: EntityKey) {
  const config = ENTITY_CONFIG[entity];
  const queryClient = useQueryClient();

  if (!config.protectedPath) {
    throw new Error(`Entity "${entity}" has no protected API path configured.`);
  }

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`${config.protectedPath!}/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? `Failed to delete ${config.label}`);
      }
    },
    onSuccess: () => {
      const keyFactory = QUERY_KEY_MAP[entity];
      queryClient.invalidateQueries({ queryKey: keyFactory?.all() ?? [entity] });
    },
  });
}
