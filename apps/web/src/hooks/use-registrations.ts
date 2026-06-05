'use client';

// ============================================================================
// Registrations — Entity-Specific Hooks
// ============================================================================
// Thin wrappers around the generic factory hooks, specialized for Registrations.
// Provides my-registrations lookup and the standard CRUD surface.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { RegistrationKeys } from '@eventology/config';
import { useDoc, useCreate, useUpdate } from '@/hooks/factory';
import type { ListOptions, ListResponse } from '@/hooks/factory';
import type { Tables } from '@eventology/schemas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RegistrationRow = Tables<'registrations'>;

export interface RegistrationWithRelations extends RegistrationRow {
  event?: {
    id: string;
    title: string;
    slug: string;
    banner_image: string | null;
    start_date: string;
    end_date: string;
    venue_name: string | null;
  };
  ticket_tier?: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  ticket?: {
    id: string;
    ticket_number: string;
    qr_data: string;
    tier_name: string;
    status: string;
    used_at: string | null;
  };
}

export type RegistrationFormData = {
  event_id: string;
  ticket_tier_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  metadata?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// List hook — returns my registrations with joined relations
// ---------------------------------------------------------------------------

export function useMyRegistrations(options?: ListOptions) {
  return useQuery<ListResponse<RegistrationWithRelations>>({
    queryKey: RegistrationKeys.list(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.status) params.set('status', options.status);

      const url = params.toString()
        ? `/api/protected/registrations?${params}`
        : '/api/protected/registrations';

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch registrations'
        );
      }

      return res.json();
    },
  });
}

// ---------------------------------------------------------------------------
// Single document hook
// ---------------------------------------------------------------------------

export function useRegistration(id: string | null) {
  return useDoc<RegistrationWithRelations>('registrations', id, true);
}

// ---------------------------------------------------------------------------
// Event registrations hook (for organizers)
// ---------------------------------------------------------------------------

export function useEventRegistrations(eventId: string | null) {
  return useQuery<ListResponse<RegistrationWithRelations>>({
    queryKey: RegistrationKeys.byEvent(eventId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/protected/events/${eventId}/registrations`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch registrations'
        );
      }
      return res.json();
    },
    enabled: !!eventId,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateRegistration() {
  return useCreate<RegistrationFormData, RegistrationRow>('registrations');
}

export function useCancelRegistration() {
  return useUpdate<{ status: 'cancelled' }, RegistrationRow>('registrations');
}
