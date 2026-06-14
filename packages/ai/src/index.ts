// ============================================================================
// @eventology/ai — Barrel Export
// ============================================================================
// Single entry point for all AI functionality.
// Import from '@eventology/ai' to access client, cache, services, types,
// and the provider seam.
// ============================================================================

// Provider seam
export {
  getAIProvider,
  StubAIProvider,
  OpenRouterProvider,
  __resetAIProviderForTests,
  __setAIProviderForTests,
  type AIProvider,
} from './provider';

// Stub fixtures (rarely used directly; useful for tests + ad-hoc seeding)
export { getStubResponse } from './stub-fixtures';

// Client + cache
export { callAI, AI_MODEL_CHAIN, resolveAIModelChain } from './client';
export { getCachedResponse, setCachedResponse, hashPrompt, setCacheClient } from './cache';

// All 18 AI service functions — explicit re-export so downstream
// `import { generateEventDescription, ... } from '@eventology/ai'`
// works at runtime (ESM re-export edge cases with `export * from`).
export {
  generateEventDescription,
  generateEventSummary,
  generateEventTags,
  generateMarketingCopy,
  generatePricingSuggestion,
  generateAnalyticsNarrative,
  generateAttendeeInsights,
  generatePerformancePrediction,
  moderateContent,
  detectFraud,
  translateContent,
  chatbotResponse,
  generateReport,
  recommendEvents,
  searchWithNLP,
  generatePlatformHealthSummary,
  analyzeAuditLog,
  generateEventRecap,
} from './services';

// Types (type-only; never produces runtime values)
export type {
  AITask,
  ModelTier,
  AIMessage,
  AIRequestOptions,
  AIResponse,
  AiCacheEntry,
  GenerateEventDescriptionInput,
  GenerateEventDescriptionOutput,
  GenerateEventSummaryInput,
  GenerateEventSummaryOutput,
  GenerateEventTagsInput,
  GenerateEventTagsOutput,
  GenerateMarketingCopyInput,
  GenerateMarketingCopyOutput,
  GeneratePricingSuggestionInput,
  PricingTier,
  GeneratePricingSuggestionOutput,
  GenerateAnalyticsNarrativeInput,
  GenerateAnalyticsNarrativeOutput,
  GenerateAttendeeInsightsInput,
  GenerateAttendeeInsightsOutput,
  GeneratePerformancePredictionInput,
  GeneratePerformancePredictionOutput,
  ModerateContentInput,
  ModerateContentOutput,
  DetectFraudInput,
  DetectFraudOutput,
  TranslateContentInput,
  TranslateContentOutput,
  ChatbotTier,
  ChatbotMessage,
  ChatbotResponseInput,
  ChatbotResponseOutput,
  GenerateReportInput,
  GenerateReportOutput,
  RecommendEventsInput,
  RecommendedEvent,
  RecommendEventsOutput,
  SearchWithNLPInput,
  SearchWithNLPOutput,
  GeneratePlatformHealthInput,
  GeneratePlatformHealthOutput,
  AnalyzeAuditLogInput,
  AnalyzeAuditLogOutput,
  GenerateEventRecapInput,
  GenerateEventRecapOutput,
} from './types';
