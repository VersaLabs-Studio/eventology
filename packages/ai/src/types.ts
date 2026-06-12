// ============================================================================
// @eventology/ai — AI Types
// ============================================================================
// All request/response types for the AI service layer.
// No `any` — strict mode everywhere (P6: End-to-End Type Safety).
// ============================================================================

// ---------------------------------------------------------------------------
// OpenRouter Client Types
// ---------------------------------------------------------------------------

/**
 * Discriminant tag for the AI task being performed. Each of the 18
 * services in `services/` passes its own tag so the provider (especially
 * the stub) can return a properly-shaped payload per service without
 * having to parse the prompt to figure out the intent.
 *
 * The list is closed and aligned with the barrel export in
 * `services/index.ts`. Adding a new service = adding a tag here AND a
 * stub fixture in `stub-fixtures.ts`.
 */
export type AITask =
  | 'generate_event_description'
  | 'generate_event_summary'
  | 'generate_event_tags'
  | 'generate_marketing_copy'
  | 'generate_pricing_suggestion'
  | 'generate_analytics_narrative'
  | 'generate_attendee_insights'
  | 'generate_performance_prediction'
  | 'moderate_content'
  | 'detect_fraud'
  | 'translate_content'
  | 'chatbot_response'
  | 'generate_report'
  | 'recommend_events'
  | 'search_with_nlp'
  | 'generate_platform_health'
  | 'analyze_audit_log'
  | 'generate_event_recap';

/** Model tier determines which model in the fallback chain to start from. */
export type ModelTier = 'heavy' | 'medium' | 'light';

/** A single message in the OpenRouter chat completion format. */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Options passed to the `callAI` function. */
export interface AIRequestOptions {
  /** Which service is calling — drives stub fixtures and live routing hints. */
  task: AITask;
  messages: AIMessage[];
  modelTier: ModelTier;
  /** If true, request JSON object output from the model. */
  response_format?: { type: 'json_object' };
  /** Override the default 30s timeout (in ms). */
  timeoutMs?: number;
  /** Temperature override (default: 0.7). */
  temperature?: number;
  /** Max tokens override. */
  max_tokens?: number;
}

/** Structured response from a successful AI call. */
export interface AIResponse {
  content: string;
  model_used: string;
  tokens_used: number;
  latency_ms: number;
}

// ---------------------------------------------------------------------------
// Cache Types
// ---------------------------------------------------------------------------

/** Shape of a row in the `ai_cache` Supabase table. */
export interface AiCacheEntry {
  id: string;
  cache_key: string;
  model_used: string;
  prompt_hash: string;
  response: string;
  tokens_used: number;
  latency_ms: number;
  expires_at: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Service Input/Output Types
// ---------------------------------------------------------------------------

// 1. Generate Event Description
export interface GenerateEventDescriptionInput {
  title: string;
  event_type: string;
  category: string;
  venue_name?: string | null;
  start_date: string;
  tags?: string[];
  short_description?: string | null;
}

export interface GenerateEventDescriptionOutput {
  description: string;
  short_description: string;
}

// 2. Generate Event Summary
export interface GenerateEventSummaryInput {
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  venue_name?: string | null;
  registrations_count: number;
  capacity: number;
}

export interface GenerateEventSummaryOutput {
  summary: string;
  highlights: string[];
}

// 3. Generate Event Tags
export interface GenerateEventTagsInput {
  title: string;
  description: string;
  event_type: string;
  category: string;
}

export interface GenerateEventTagsOutput {
  tags: string[];
}

// 4. Generate Marketing Copy
export interface GenerateMarketingCopyInput {
  event_title: string;
  event_description: string;
  event_type: string;
  target_audience: string;
  platform: 'email' | 'social' | 'sms' | 'push';
  tone?: 'professional' | 'casual' | 'exciting' | 'urgent';
}

export interface GenerateMarketingCopyOutput {
  subject?: string;
  headline: string;
  body: string;
  cta: string;
}

// 5. Generate Pricing Suggestion
export interface GeneratePricingSuggestionInput {
  event_type: string;
  category: string;
  venue_capacity: number;
  target_audience: string;
  comparable_event_prices?: number[];
  organizer_tier?: 'new' | 'established' | 'premium';
}

export interface PricingTier {
  name: string;
  suggested_price: number;
  currency: string;
  rationale: string;
}

export interface GeneratePricingSuggestionOutput {
  tiers: PricingTier[];
  general_advice: string;
  confidence: 'low' | 'medium' | 'high';
}

// 6. Generate Analytics Narrative
export interface GenerateAnalyticsNarrativeInput {
  event_title: string;
  registrations_count: number;
  capacity: number;
  views_count: number;
  revenue?: number;
  period_label: string;
  previous_registrations?: number;
  previous_views?: number;
}

export interface GenerateAnalyticsNarrativeOutput {
  narrative: string;
  key_metrics: { label: string; value: string; trend?: string }[];
  recommendations: string[];
}

// 7. Generate Attendee Insights
export interface GenerateAttendeeInsightsInput {
  event_title: string;
  total_registrations: number;
  checked_in_count: number;
  cancelled_count: number;
  ticket_tiers: { name: string; sold: number; capacity: number }[];
  registration_dates: string[];
  top_sub_cities?: string[];
}

export interface GenerateAttendeeInsightsOutput {
  insights: string[];
  attendance_rate: number;
  peak_registration_period: string;
  recommendations: string[];
}

// 8. Generate Performance Prediction
export interface GeneratePerformancePredictionInput {
  event_title: string;
  event_type: string;
  days_until_event: number;
  current_registrations: number;
  capacity: number;
  views_trend: number[];
  registrations_trend: number[];
  is_featured: boolean;
}

export interface GeneratePerformancePredictionOutput {
  predicted_attendance: number;
  confidence: 'low' | 'medium' | 'high';
  fill_rate_percent: number;
  risk_level: 'low' | 'medium' | 'high';
  suggestions: string[];
}

// 9. Moderate Content
export interface ModerateContentInput {
  content: string;
  content_type: 'event_description' | 'review' | 'message' | 'profile_bio';
  context?: string;
}

export interface ModerateContentOutput {
  is_safe: boolean;
  flags: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
  suggested_action: 'approve' | 'review' | 'reject';
  reason?: string;
}

// 10. Detect Fraud
export interface DetectFraudInput {
  action_type: 'registration' | 'payment' | 'ticket_use' | 'promo_code';
  user_id: string;
  ip_address?: string;
  device_fingerprint?: string;
  metadata: Record<string, unknown>;
  recent_actions?: { action: string; timestamp: string }[];
}

export interface DetectFraudOutput {
  is_suspicious: boolean;
  risk_score: number;
  flags: string[];
  recommended_action: 'allow' | 'flag' | 'block' | 'review';
  reason?: string;
}

// 11. Translate Content
export interface TranslateContentInput {
  text: string;
  source_language?: string;
  target_language: string;
  content_type?: 'general' | 'event' | 'marketing' | 'legal';
}

export interface TranslateContentOutput {
  translated_text: string;
  source_language: string;
  target_language: string;
  confidence: number;
}

// 12. Chatbot Response
export type ChatbotTier = 'public' | 'organizer' | 'admin' | 'support';

export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotResponseInput {
  tier: ChatbotTier;
  messages: ChatbotMessage[];
  context?: {
    user_name?: string;
    user_role?: string;
    current_page?: string;
    event_id?: string;
    event_title?: string;
  };
}

export interface ChatbotResponseOutput {
  response: string;
  suggested_actions?: string[];
  escalate_to_human?: boolean;
}

// 13. Generate Report
export interface GenerateReportInput {
  report_type: 'event' | 'organizer' | 'platform' | 'financial';
  title: string;
  data: Record<string, unknown>;
  period: { start: string; end: string };
  audience: 'organizer' | 'admin' | 'external';
}

export interface GenerateReportOutput {
  title: string;
  executive_summary: string;
  sections: { heading: string; content: string }[];
  key_findings: string[];
  recommendations: string[];
}

// 14. Recommend Events
export interface RecommendEventsInput {
  user_id: string;
  user_preferences?: {
    categories?: string[];
    event_types?: string[];
    location?: string;
    price_range?: { min: number; max: number };
  };
  past_attendance?: { event_id: string; category: string; rating: number }[];
  available_events: {
    id: string;
    title: string;
    category: string;
    event_type: string;
    tags: string[];
    start_date: string;
    price?: number;
  }[];
  limit?: number;
}

export interface RecommendedEvent {
  event_id: string;
  title: string;
  match_score: number;
  reason: string;
}

export interface RecommendEventsOutput {
  recommendations: RecommendedEvent[];
}

// 15. Search with NLP
export interface SearchWithNLPInput {
  query: string;
  available_categories?: string[];
  available_event_types?: string[];
  available_locations?: string[];
}

export interface SearchWithNLPOutput {
  interpreted_query: string;
  filters: {
    categories?: string[];
    event_types?: string[];
    locations?: string[];
    date_range?: { start?: string; end?: string };
    price_range?: { min?: number; max?: number };
    tags?: string[];
  };
  keywords: string[];
  intent: 'search' | 'browse' | 'specific_event' | 'recommendation';
}

// 16. Generate Platform Health Summary
export interface GeneratePlatformHealthInput {
  total_events: number;
  active_events: number;
  total_users: number;
  new_users_period: number;
  total_registrations: number;
  revenue_period: number;
  pending_moderations: number;
  flagged_content: number;
  system_errors: number;
  period_label: string;
}

export interface GeneratePlatformHealthOutput {
  status: 'healthy' | 'attention' | 'critical';
  summary: string;
  highlights: { metric: string; value: string; status: 'good' | 'warning' | 'critical' }[];
  action_items: string[];
}

// 17. Analyze Audit Log
export interface AnalyzeAuditLogInput {
  entries: {
    action: string;
    target_type: string;
    target_label?: string;
    actor_id?: string;
    details?: string;
    created_at: string;
  }[];
  period_label: string;
  focus?: 'security' | 'compliance' | 'operations' | 'all';
}

export interface AnalyzeAuditLogOutput {
  summary: string;
  patterns: { pattern: string; severity: 'info' | 'warning' | 'critical'; count: number }[];
  anomalies: string[];
  recommendations: string[];
  compliance_status: 'compliant' | 'needs_review' | 'non_compliant';
}

// 18. Generate Event Recap
export interface GenerateEventRecapInput {
  event_title: string;
  event_type: string;
  description: string;
  start_date: string;
  end_date: string;
  venue_name?: string | null;
  total_registrations: number;
  checked_in_count: number;
  capacity: number;
  highlights?: string[];
  feedback_summary?: string;
  revenue?: number;
}

export interface GenerateEventRecapOutput {
  recap_title: string;
  recap_body: string;
  key_stats: { label: string; value: string }[];
  highlights: string[];
  thank_you_message: string;
}
