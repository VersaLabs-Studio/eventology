'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import { QUERY_KEY_MAP } from './query-key-map';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Generic create mutation
// ---------------------------------------------------------------------------

/**
 * Creates a new entity via the protected API route.
 * Invalidates all list queries for the entity on success.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 */
export function useCreate<TInput = unknown, TOutput = unknown>(entity: EntityKey) {
  const config = ENTITY_CONFIG[entity];
  const queryClient = useQueryClient();

  if (!config.protectedPath) {
    throw new Error(`Entity "${entity}" has no protected API path configured.`);
  }

  return useMutation<TOutput, Error, TInput>({
    mutationFn: async (data) => {
      const res = await fetch(config.protectedPath!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? `Failed to create ${config.label}`);
      }

      return res.json();
    },
    onSuccess: () => {
      const keyFactory = QUERY_KEY_MAP[entity];
      queryClient.invalidateQueries({ queryKey: keyFactory?.all() ?? [entity] });
    },
  });
}
