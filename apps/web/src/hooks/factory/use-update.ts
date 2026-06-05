'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import { QUERY_KEY_MAP } from './query-key-map';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Generic update mutation (PUT — full replace)
// ---------------------------------------------------------------------------

/**
 * Updates an entity by ID via the protected API route.
 * Invalidates the specific doc query AND all list queries.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 */
export function useUpdate<TInput = unknown, TOutput = unknown>(entity: EntityKey) {
  const config = ENTITY_CONFIG[entity];
  const queryClient = useQueryClient();

  if (!config.protectedPath) {
    throw new Error(`Entity "${entity}" has no protected API path configured.`);
  }

  return useMutation<TOutput, Error, { id: string; data: TInput }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`${config.protectedPath!}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? `Failed to update ${config.label}`);
      }

      return res.json();
    },
    onSuccess: (_, { id }) => {
      const keyFactory = QUERY_KEY_MAP[entity];
      queryClient.invalidateQueries({ queryKey: keyFactory?.all() ?? [entity] });
      queryClient.invalidateQueries({ queryKey: keyFactory?.doc(id) ?? [entity, 'doc', id] });
    },
  });
}
