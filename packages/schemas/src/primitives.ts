// ============================================================================
// @eventology/schemas — Shared Primitives
// ============================================================================
// PostgreSQL-compatible UUID helper. Zod v4's built-in `z.string().uuid()`
// enforces RFC 9562 (only version 1-8, variant 8/a/b), which REJECTS DB IDs
// that use version 0 (e.g. seed categories like
// "a1000000-0000-0000-0000-000000000001"). PostgreSQL itself accepts any
// 32-hex sequence in 8-4-4-4-12 format. Use `pgUuid()` for every schema
// field that holds a DB-sourced UUID — never `.uuid()`.
// ============================================================================

import { z } from 'zod';

const PG_UUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const pgUuid = (msg = 'Invalid UUID') => z.string().regex(PG_UUID, msg);
