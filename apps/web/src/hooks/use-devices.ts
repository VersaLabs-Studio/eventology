'use client';

// ============================================================================
// Devices — Push Token Registration
// ============================================================================
// Web uses the /api/protected/devices route (over the existing 026
// push_tokens table). Mobile (B4) consumes the same route.
// ============================================================================

import { useMutation } from '@tanstack/react-query';

export type DevicePlatform = 'ios' | 'android' | 'web';

export function useUpsertPushToken() {
  return useMutation({
    mutationFn: async (input: { token: string; platform: DevicePlatform }) => {
      const res = await fetch('/api/protected/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to register device');
      }
      return res.json() as Promise<{ id: string; profile_id: string; platform: string; token: string }>;
    },
  });
}

export function useDeletePushToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch('/api/protected/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to deregister');
      }
      return { success: true } as const;
    },
  });
}
