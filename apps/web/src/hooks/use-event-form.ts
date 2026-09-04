'use client';

// ============================================================================
// Event Form — Entity-Specific Hooks (HO-I)
// ============================================================================
// Custom registration form fields + the gated join link.
// Reads: public render path (register page) + protected host path (builder).
// Mutations: protected routes; every one invalidates EventFormKeys.all()
// (matches the factory convention).
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EventFormKeys, JoinLinkKeys } from '@eventology/config';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types (shaped to the route responses)
// ---------------------------------------------------------------------------

/** Public render shape — labels/options only, no host metadata. */
export interface PublicFormField {
  id: string;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'number';
  options: string[] | null;
  required: boolean;
  position: number;
}

/** Full builder row — mirrors event_form_fields. */
export interface EventFormField {
  id: string;
  event_id: string;
  label: string;
  field_type: PublicFormField['field_type'];
  options: string[] | null;
  required: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFormFieldInput {
  label: string;
  field_type: EventFormField['field_type'];
  options?: string[];
  required?: boolean;
  position?: number;
}

export interface UpdateFormFieldInput {
  label?: string;
  field_type?: EventFormField['field_type'];
  options?: string[] | null;
  required?: boolean;
  position?: number;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Organizer builder read — full rows for the event (host-gated server-side). */
export function useEventFormFields(eventId: string | null) {
  return useQuery<EventFormField[]>({
    queryKey: EventFormKeys.byEvent(eventId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/protected/events/${eventId}/form-fields`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load form fields');
      }
      const json = (await res.json()) as { data: EventFormField[] };
      return json.data;
    },
    enabled: !!eventId,
  });
}

/** Public render read — the register form's questions for an event slug. */
export function usePublicEventFormFields(slug: string | null) {
  return useQuery<PublicFormField[]>({
    queryKey: EventFormKeys.byEvent(`public:${slug ?? ''}`),
    queryFn: async () => {
      const res = await fetch(`/api/public/events/${slug}/form-fields`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load form fields');
      }
      const json = (await res.json()) as { data: PublicFormField[] };
      return json.data;
    },
    enabled: !!slug,
  });
}

/** Gated join-link (virtual/hybrid). Enabled only for online/hybrid events. */
export interface JoinLink {
  url: string;
  provider: string;
  location_type: string;
}

export function useJoinLink(eventId: string | null, enabled: boolean) {
  return useQuery<JoinLink>({
    queryKey: JoinLinkKeys.byEvent(eventId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/protected/events/${eventId}/join-link`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Join link unavailable');
      }
      return res.json();
    },
    enabled: !!eventId && enabled,
    staleTime: 60_000, // the URL rarely changes; keep it snappy
  });
}

// ---------------------------------------------------------------------------
// Mutations (builder)
// ---------------------------------------------------------------------------

function useInvalidateFormFields() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: EventFormKeys.all() });
}

export function useCreateFormField(eventId: string) {
  const invalidate = useInvalidateFormFields();
  return useMutation<EventFormField, Error, CreateFormFieldInput>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/protected/events/${eventId}/form-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to add field');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export function useUpdateFormField(eventId: string) {
  const invalidate = useInvalidateFormFields();
  return useMutation<EventFormField, Error, { fieldId: string; input: UpdateFormFieldInput }>({
    mutationFn: async ({ fieldId, input }) => {
      const res = await fetch(
        `/api/protected/events/${eventId}/form-fields?fieldId=${fieldId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to update field');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export function useDeleteFormField(eventId: string) {
  const invalidate = useInvalidateFormFields();
  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: async (fieldId) => {
      const res = await fetch(
        `/api/protected/events/${eventId}/form-fields?fieldId=${fieldId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to delete field');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

/** Reorder: send the full ordered id list; server reindexes positions. */
export function useReorderFormFields(eventId: string) {
  const invalidate = useInvalidateFormFields();
  return useMutation<{ ok: boolean }, Error, string[]>({
    mutationFn: async (fieldIds) => {
      const res = await fetch(`/api/protected/events/${eventId}/form-fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_ids: fieldIds }),
      });
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to reorder fields');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

/** Submit answers for a registration (register page, post-registration). */
export function useSubmitAnswers() {
  return useMutation<{ ok: boolean; saved: number }, Error, { registrationId: string; answers: Array<{ field_id: string; value: unknown }> }>({
    mutationFn: async ({ registrationId, answers }) => {
      const res = await fetch(`/api/protected/registrations/${registrationId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to save answers');
      }
      return res.json();
    },
  });
}
