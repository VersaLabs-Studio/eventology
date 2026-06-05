// ============================================================================
// Factory Hooks — Barrel Export
// ============================================================================
// Generic data-access hooks parameterized by entity key.
// Every module uses these; no module writes bespoke fetch logic.
// ============================================================================

export { useList, type ListOptions, type ListResponse } from './use-list';
export { useDoc } from './use-doc';
export { useCreate } from './use-create';
export { useUpdate } from './use-update';
export { useDelete } from './use-delete';
