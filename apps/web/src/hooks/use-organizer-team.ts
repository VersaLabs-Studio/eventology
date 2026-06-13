'use client';

// ============================================================================
// Team Members — Entity-Specific Hooks (organizer-scoped)
// ============================================================================
// Owns the team management calls to /api/protected/organizers/[id]/team
// (GET/POST) and /[memberId] (PATCH/DELETE). The caller passes the
// organizer id; RLS + app-level ownership check on the server enforce
// that the user actually owns the organizer.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TeamMemberRow } from '@/app/api/protected/organizers/[id]/team/route';

export type { TeamMemberRow };

const TEAM_KEY = (organizerId: string) => ['organizer-team', organizerId] as const;

interface TeamResponse {
  data: TeamMemberRow[];
  meta: { total: number; page: number; limit: number };
}

export function useOrganizerTeam(organizerId: string | null) {
  return useQuery<TeamResponse>({
    queryKey: TEAM_KEY(organizerId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/protected/organizers/${organizerId}/team`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch team');
      }
      return res.json();
    },
    enabled: !!organizerId,
  });
}

export function useInviteTeamMember(organizerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: 'admin' | 'member' }) => {
      const res = await fetch(`/api/protected/organizers/${organizerId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to invite');
      }
      return res.json() as Promise<TeamMemberRow>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEAM_KEY(organizerId) });
    },
  });
}

export function useUpdateTeamMember(organizerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'admin' | 'member' }) => {
      const res = await fetch(`/api/protected/organizers/${organizerId}/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to update role');
      }
      return res.json() as Promise<TeamMemberRow>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEAM_KEY(organizerId) });
    },
  });
}

export function useRemoveTeamMember(organizerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/protected/organizers/${organizerId}/team/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to remove');
      }
      return { success: true } as const;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEAM_KEY(organizerId) });
    },
  });
}
