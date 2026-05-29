// ============================================================================
// @eventology/ai — Barrel Export
// ============================================================================
// Single entry point for all AI functionality.
// Import from '@eventology/ai' to access client, cache, services, and types.
// ============================================================================

// OpenRouter client
export { callAI, MODEL_CHAIN } from './client';

// Cache utilities
export { getCachedResponse, setCachedResponse, hashPrompt, setCacheClient } from './cache';

// All 18 AI service functions
export * from './services';

// All types
export * from './types';
