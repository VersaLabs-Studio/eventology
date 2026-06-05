-- ============================================================================
-- Migration 020: Add pending_payment to registration_status
-- Supports the paid registration flow (D7-003).
-- ============================================================================

ALTER TYPE public.registration_status ADD VALUE IF NOT EXISTS 'pending_payment';
