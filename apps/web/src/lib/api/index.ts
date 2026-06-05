// ============================================================================
// API Route Factories — Barrel Export
// ============================================================================
// Generic route handler factories parameterized by entity key.
// Every API route uses these; no route writes bespoke CRUD logic.
// ============================================================================

export { createListHandler, type ListEnvelope, type ListMeta, type ErrorEnvelope } from './list-handler';
export { createDocHandler } from './doc-handler';
export { createCreateHandler } from './create-handler';
export { createUpdateHandler } from './update-handler';
export { createDeleteHandler } from './delete-handler';
