// ============================================================================
// AI Service — Server-side helpers
// ============================================================================
// Web-app-side convenience helpers that wrap the @eventology/ai package
// services for the four AI surfaces. They:
//   - Call initializeAI() once to wire the cache
//   - Return a normalized `{ ok: boolean, data: T | null, error?: string }`
//     envelope so route handlers can return consistent JSON
//   - Never throw — best-effort per the AI-007 contract
// ============================================================================

import {
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
  type GenerateEventDescriptionOutput,
  type GenerateEventSummaryOutput,
  type GenerateEventTagsOutput,
  type GenerateMarketingCopyOutput,
  type GeneratePricingSuggestionOutput,
  type GenerateAnalyticsNarrativeOutput,
  type GenerateAttendeeInsightsOutput,
  type GeneratePerformancePredictionOutput,
  type ModerateContentOutput,
  type DetectFraudOutput,
  type TranslateContentOutput,
  type ChatbotResponseOutput,
  type GenerateReportOutput,
  type RecommendEventsOutput,
  type SearchWithNLPOutput,
  type GeneratePlatformHealthOutput,
  type AnalyzeAuditLogOutput,
  type GenerateEventRecapOutput,
  type GenerateEventDescriptionInput,
  type GenerateEventSummaryInput,
  type GenerateEventTagsInput,
  type GenerateMarketingCopyInput,
  type GeneratePricingSuggestionInput,
  type GenerateAnalyticsNarrativeInput,
  type GenerateAttendeeInsightsInput,
  type GeneratePerformancePredictionInput,
  type ModerateContentInput,
  type DetectFraudInput,
  type TranslateContentInput,
  type ChatbotResponseInput,
  type GenerateReportInput,
  type RecommendEventsInput,
  type SearchWithNLPInput,
  type GeneratePlatformHealthInput,
  type AnalyzeAuditLogInput,
  type GenerateEventRecapInput,
} from '@eventology/ai';
import { initializeAI } from './init';

export interface AIServiceResult<T> {
  ok: boolean;
  data: T | null;
  error?: string;
}

function envelope<T>(data: T | null, error?: string): AIServiceResult<T> {
  return error ? { ok: false, data: null, error } : { ok: data !== null, data };
}

// ---------------------------------------------------------------------------
// Per-service wrappers — all best-effort, no throws
// ---------------------------------------------------------------------------

export async function aiGenerateEventDescription(
  input: GenerateEventDescriptionInput
): Promise<AIServiceResult<GenerateEventDescriptionOutput>> {
  initializeAI();
  return envelope<GenerateEventDescriptionOutput>(await generateEventDescription(input));
}

export async function aiGenerateEventSummary(
  input: GenerateEventSummaryInput
): Promise<AIServiceResult<GenerateEventSummaryOutput>> {
  initializeAI();
  return envelope<GenerateEventSummaryOutput>(await generateEventSummary(input));
}

export async function aiGenerateEventTags(
  input: GenerateEventTagsInput
): Promise<AIServiceResult<GenerateEventTagsOutput>> {
  initializeAI();
  return envelope<GenerateEventTagsOutput>(await generateEventTags(input));
}

export async function aiGenerateMarketingCopy(
  input: GenerateMarketingCopyInput
): Promise<AIServiceResult<GenerateMarketingCopyOutput>> {
  initializeAI();
  return envelope<GenerateMarketingCopyOutput>(await generateMarketingCopy(input));
}

export async function aiGeneratePricingSuggestion(
  input: GeneratePricingSuggestionInput
): Promise<AIServiceResult<GeneratePricingSuggestionOutput>> {
  initializeAI();
  return envelope<GeneratePricingSuggestionOutput>(await generatePricingSuggestion(input));
}

export async function aiGenerateAnalyticsNarrative(
  input: GenerateAnalyticsNarrativeInput
): Promise<AIServiceResult<GenerateAnalyticsNarrativeOutput>> {
  initializeAI();
  return envelope<GenerateAnalyticsNarrativeOutput>(await generateAnalyticsNarrative(input));
}

export async function aiGenerateAttendeeInsights(
  input: GenerateAttendeeInsightsInput
): Promise<AIServiceResult<GenerateAttendeeInsightsOutput>> {
  initializeAI();
  return envelope<GenerateAttendeeInsightsOutput>(await generateAttendeeInsights(input));
}

export async function aiGeneratePerformancePrediction(
  input: GeneratePerformancePredictionInput
): Promise<AIServiceResult<GeneratePerformancePredictionOutput>> {
  initializeAI();
  return envelope<GeneratePerformancePredictionOutput>(
    await generatePerformancePrediction(input)
  );
}

export async function aiModerateContent(
  input: ModerateContentInput
): Promise<AIServiceResult<ModerateContentOutput>> {
  initializeAI();
  return envelope<ModerateContentOutput>(await moderateContent(input));
}

export async function aiDetectFraud(
  input: DetectFraudInput
): Promise<AIServiceResult<DetectFraudOutput>> {
  initializeAI();
  return envelope<DetectFraudOutput>(await detectFraud(input));
}

export async function aiTranslateContent(
  input: TranslateContentInput
): Promise<AIServiceResult<TranslateContentOutput>> {
  initializeAI();
  return envelope<TranslateContentOutput>(await translateContent(input));
}

export async function aiChatbotResponse(
  input: ChatbotResponseInput
): Promise<AIServiceResult<ChatbotResponseOutput>> {
  initializeAI();
  return envelope<ChatbotResponseOutput>(await chatbotResponse(input));
}

export async function aiGenerateReport(
  input: GenerateReportInput
): Promise<AIServiceResult<GenerateReportOutput>> {
  initializeAI();
  return envelope<GenerateReportOutput>(await generateReport(input));
}

export async function aiRecommendEvents(
  input: RecommendEventsInput
): Promise<AIServiceResult<RecommendEventsOutput>> {
  initializeAI();
  return envelope<RecommendEventsOutput>(await recommendEvents(input));
}

export async function aiSearchWithNLP(
  input: SearchWithNLPInput
): Promise<AIServiceResult<SearchWithNLPOutput>> {
  initializeAI();
  return envelope<SearchWithNLPOutput>(await searchWithNLP(input));
}

export async function aiGeneratePlatformHealthSummary(
  input: GeneratePlatformHealthInput
): Promise<AIServiceResult<GeneratePlatformHealthOutput>> {
  initializeAI();
  return envelope<GeneratePlatformHealthOutput>(await generatePlatformHealthSummary(input));
}

export async function aiAnalyzeAuditLog(
  input: AnalyzeAuditLogInput
): Promise<AIServiceResult<AnalyzeAuditLogOutput>> {
  initializeAI();
  return envelope<AnalyzeAuditLogOutput>(await analyzeAuditLog(input));
}

export async function aiGenerateEventRecap(
  input: GenerateEventRecapInput
): Promise<AIServiceResult<GenerateEventRecapOutput>> {
  initializeAI();
  return envelope<GenerateEventRecapOutput>(await generateEventRecap(input));
}
