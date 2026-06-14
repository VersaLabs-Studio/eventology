// ============================================================================
// Chapa API Types
// ============================================================================
// Fully typed Chapa request/response payloads (Part 3 §1.4).
// No `any` — every shape is explicit.
// Includes Zod schemas for runtime validation of external payloads.
// ============================================================================

import { z } from 'zod';

/** Metadata passed to ChapaProvider.initiate() from the registration route */
export interface ChapaInitMetadata {
  attendee_name?: string;
  attendee_phone?: string;
  event_title?: string;
}

/** Chapa payment initialization request payload */
export interface ChapaInitPayload {
  amount: string;
  currency: 'ETB';
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title: string;
    description: string;
    logo: string;
  };
}

/** Chapa payment initialization response */
export interface ChapaInitResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

/** Chapa transaction verification response */
export interface ChapaVerifyResponse {
  message: string;
  status: string;
  data: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    created_at: string;
    updated_at: string;
  };
}

/** Chapa webhook callback payload — runtime-validated via Zod */
export interface ChapaWebhookPayload {
  tx_ref: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Zod schema for validating Chapa webhook payloads at runtime.
 * External payloads must never be trusted without validation.
 */
export const chapaWebhookPayloadSchema = z.object({
  tx_ref: z.string().min(1),
  status: z.string().min(1),
}).passthrough();
