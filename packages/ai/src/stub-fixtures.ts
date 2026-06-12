// ============================================================================
// @eventology/ai — Stub Fixtures
// ============================================================================
// Deterministic, valid-JSON responses for each of the 18 AI tasks. These
// are returned by StubAIProvider (the default in dev) and let every
// downstream service + route + UI surface be exercised with zero keys.
//
// Goals:
//   - Each fixture is shape-valid against the corresponding *Output type.
//   - Deterministic given the same input (stable for tests/demos).
//   - Where it makes sense, the fixture reflects the input (recommendations
//     echo IDs from `available_events`, search echoes the query, etc.) so
//     demos feel real.
//   - No network. No timing. Pure functions.
//
// Adding a new AI service = adding a new AITask tag AND a fixture here.
// ============================================================================

import type { AITask, AIMessage } from './types';

// ---------------------------------------------------------------------------
// Type definitions for fixture outputs (re-declared narrowly so this file
// has no dependency on the service-specific input types — fixtures only
// need to satisfy the OUTPUT shape, not the INPUT)
// ---------------------------------------------------------------------------

type StubOutputMap = {
  generate_event_description: { description: string; short_description: string };
  generate_event_summary: { summary: string; highlights: string[] };
  generate_event_tags: { tags: string[] };
  generate_marketing_copy: {
    subject?: string;
    headline: string;
    body: string;
    cta: string;
  };
  generate_pricing_suggestion: {
    tiers: { name: string; suggested_price: number; currency: string; rationale: string }[];
    general_advice: string;
    confidence: 'low' | 'medium' | 'high';
  };
  generate_analytics_narrative: {
    narrative: string;
    key_metrics: { label: string; value: string; trend?: string }[];
    recommendations: string[];
  };
  generate_attendee_insights: {
    insights: string[];
    attendance_rate: number;
    peak_registration_period: string;
    recommendations: string[];
  };
  generate_performance_prediction: {
    predicted_attendance: number;
    confidence: 'low' | 'medium' | 'high';
    fill_rate_percent: number;
    risk_level: 'low' | 'medium' | 'high';
    suggestions: string[];
  };
  moderate_content: {
    is_safe: boolean;
    flags: string[];
    severity: 'none' | 'low' | 'medium' | 'high';
    suggested_action: 'approve' | 'review' | 'reject';
    reason?: string;
  };
  detect_fraud: {
    is_suspicious: boolean;
    risk_score: number;
    flags: string[];
    recommended_action: 'allow' | 'flag' | 'block' | 'review';
    reason?: string;
  };
  translate_content: {
    translated_text: string;
    source_language: string;
    target_language: string;
    confidence: number;
  };
  chatbot_response: {
    response: string;
    suggested_actions?: string[];
    escalate_to_human?: boolean;
  };
  generate_report: {
    title: string;
    executive_summary: string;
    sections: { heading: string; content: string }[];
    key_findings: string[];
    recommendations: string[];
  };
  recommend_events: {
    recommendations: { event_id: string; title: string; match_score: number; reason: string }[];
  };
  search_with_nlp: {
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
  };
  generate_platform_health: {
    status: 'healthy' | 'attention' | 'critical';
    summary: string;
    highlights: { metric: string; value: string; status: 'good' | 'warning' | 'critical' }[];
    action_items: string[];
  };
  analyze_audit_log: {
    summary: string;
    patterns: { pattern: string; severity: 'info' | 'warning' | 'critical'; count: number }[];
    anomalies: string[];
    recommendations: string[];
    compliance_status: 'compliant' | 'needs_review' | 'non_compliant';
  };
  generate_event_recap: {
    recap_title: string;
    recap_body: string;
    key_stats: { label: string; value: string }[];
    highlights: string[];
    thank_you_message: string;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the most-recent user message in the chat-completion prompt.
 * Used by stubs that want to reflect what the user said (recommendations,
 * search, chatbot, etc.).
 */
function lastUserText(messages: readonly AIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') return messages[i]?.content ?? '';
  }
  return '';
}

/**
 * Crude JSON-excavation: finds the first `{...}` block in the user
 * prompt (the service's `buildUserPrompt` typically inlines the input
 * fields as JSON). We don't try to be clever — the stub is best-effort.
 */
function extractUserJson(messages: readonly AIMessage[]): Record<string, unknown> | null {
  const text = lastUserText(messages);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Per-task fixtures
// ---------------------------------------------------------------------------

const fixtures: {
  [K in AITask]: (messages: readonly AIMessage[]) => StubOutputMap[K];
} = {
  // 1. Generate Event Description
  generate_event_description: () => ({
    description:
      'Join us for a memorable event in Addis Ababa. This gathering brings together curious minds, ' +
      'industry leaders, and community members for a day of learning, networking, and shared ' +
      'experience. Expect thoughtful sessions, hands-on activities, and meaningful conversations. ' +
      'Whether you are a first-time attendee or a returning member, you will find something here ' +
      'to inspire your next step.',
    short_description:
      'A day of learning, networking, and shared experience in the heart of Addis Ababa.',
  }),

  // 2. Generate Event Summary
  generate_event_summary: () => ({
    summary:
      'A well-attended community event with strong engagement across sessions. Highlights included ' +
      'opening keynote, two breakout tracks, and a closing networking hour. Attendee feedback was ' +
      'overwhelmingly positive, with the venue and pacing scoring especially well.',
    highlights: [
      'Sold-out main hall for opening keynote',
      'Highest engagement on the workshop track',
      'Strong net-new signups from the closing networking hour',
    ],
  }),

  // 3. Generate Event Tags
  generate_event_tags: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const base =
      typeof input.title === 'string' ? input.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 3) : [];
    const seed = [...base, 'addis-ababa', 'community', 'networking'];
    return { tags: Array.from(new Set(seed)).slice(0, 6) };
  },

  // 4. Generate Marketing Copy
  generate_marketing_copy: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const title = typeof input.event_title === 'string' ? input.event_title : 'This event';
    return {
      subject: `Don't miss: ${title}`,
      headline: `${title} — your next great experience`,
      body:
        `We are putting the finishing touches on ${title} and we want you there. ` +
        'Expect an energizing day, thoughtful people, and a few surprises. ' +
        'Early registration is open — secure your spot today.',
      cta: 'Reserve your spot',
    };
  },

  // 5. Generate Pricing Suggestion
  generate_pricing_suggestion: () => ({
    tiers: [
      {
        name: 'Early Bird',
        suggested_price: 200,
        currency: 'ETB',
        rationale: 'Drives early commitment and creates urgency; below median to remove price friction.',
      },
      {
        name: 'General',
        suggested_price: 350,
        currency: 'ETB',
        rationale: 'Median price point for comparable community events in Addis Ababa.',
      },
      {
        name: 'VIP',
        suggested_price: 750,
        currency: 'ETB',
        rationale: 'Reserved seating + perks; priced for premium experience without pricing out the core audience.',
      },
    ],
    general_advice:
      'Lead with Early Bird to seed momentum, hold General for steady demand, and reserve VIP for the top decile. ' +
      'If registrations lag 30 days out, drop Early Bird to General pricing for the final week.',
    confidence: 'medium',
  }),

  // 6. Generate Analytics Narrative
  generate_analytics_narrative: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const period = typeof input.period_label === 'string' ? input.period_label : 'this period';
    return {
      narrative:
        `Across ${period}, registrations and views held steady with a healthy conversion ratio. ` +
        'The strongest channel for new registrations was direct discovery, followed by social shares from ' +
        'attendees. A small lift came from the recent featured-placement slot. ',
      key_metrics: [
        { label: 'Registrations', value: '142', trend: '+8% vs prior period' },
        { label: 'Page views', value: '3,210', trend: '+3% vs prior period' },
        { label: 'Conversion', value: '4.4%', trend: 'stable' },
      ],
      recommendations: [
        'Send a mid-cycle reminder to registered-but-not-yet-paying attendees.',
        'Add two more social-share moments in the final week.',
        'A/B test the registration CTA copy against the current variant.',
      ],
    };
  },

  // 7. Generate Attendee Insights
  generate_attendee_insights: () => ({
    insights: [
      'Strong first-day registration spike — most attendees commit within 24h of the announcement.',
      'Sub-city distribution skews toward Bole and Kirkos; consider targeted outreach in Yeka and Lideta.',
      'Cancellation rate is below 4%, indicating high intent at registration.',
    ],
    attendance_rate: 0.86,
    peak_registration_period: 'Week 1 of registration window',
    recommendations: [
      'Add a waitlist for the popular tier — sold-out signal is strong.',
      'Re-engage users who started but did not complete registration.',
    ],
  }),

  // 8. Generate Performance Prediction
  generate_performance_prediction: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const capacity = typeof input.capacity === 'number' ? input.capacity : 100;
    const current = typeof input.current_registrations === 'number' ? input.current_registrations : 0;
    const predicted = Math.min(capacity, Math.round(current + capacity * 0.15));
    const fill = Math.round((predicted / capacity) * 100);
    return {
      predicted_attendance: predicted,
      confidence: 'medium',
      fill_rate_percent: fill,
      risk_level: fill >= 90 ? 'low' : fill >= 60 ? 'medium' : 'high',
      suggestions: [
        'Open a second tier to capture overflow demand.',
        'Send a final-week reminder to nudge fence-sitters.',
      ],
    };
  },

  // 9. Moderate Content
  moderate_content: () => ({
    is_safe: true,
    flags: [],
    severity: 'none',
    suggested_action: 'approve',
  }),

  // 10. Detect Fraud
  detect_fraud: () => ({
    is_suspicious: false,
    risk_score: 0.05,
    flags: [],
    recommended_action: 'allow',
  }),

  // 11. Translate Content
  translate_content: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const text = typeof input.text === 'string' ? input.text : '';
    return {
      translated_text: text,
      source_language: typeof input.source_language === 'string' ? input.source_language : 'auto',
      target_language: typeof input.target_language === 'string' ? input.target_language : 'en',
      confidence: 0.95,
    };
  },

  // 12. Chatbot Response
  chatbot_response: (messages) => {
    const user = lastUserText(messages);
    const sysText = messages.find((m) => m.role === 'system')?.content ?? '';
    const tier = sysText.includes('organizer')
      ? 'organizer'
      : sysText.includes('admin')
        ? 'admin'
        : sysText.includes('customer service') || sysText.includes('support')
          ? 'support'
          : 'public';
    const reply =
      tier === 'organizer'
        ? `Here's a quick organizer-focused answer about "${user}": use the event editor for content, the analytics tab for performance, and the revenue tab for payouts. Need me to walk you through any of those?`
        : tier === 'admin'
          ? `From the admin side, "${user}" is something you can resolve in the platform dashboard or the audit log. I can guide you to the exact panel if you tell me which metric you want to inspect.`
          : tier === 'support'
            ? `I hear you on "${user}". Let me help — could you share your account email or the event title so I can pull up the right details? If the issue is urgent, I can escalate to a human agent.`
            : `Great question about "${user}". On Eventology you can browse events in Addis Ababa, filter by date and category, and register in under a minute. Want me to suggest something specific?`;
    return { response: reply };
  },

  // 13. Generate Report
  generate_report: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const title = typeof input.title === 'string' ? input.title : 'Eventology Report';
    return {
      title,
      executive_summary:
        'Strong performance across the headline metrics. Registrations trended ahead of plan, ' +
        'with the venue and tier mix as the two largest drivers of the upside.',
      sections: [
        { heading: 'Headline metrics', content: 'Registrations, revenue, and conversion all beat plan.' },
        { heading: 'Drivers', content: 'Featured placement and the early-bird tier delivered the most lift.' },
        { heading: 'Risks', content: 'Late-cycle cancellations slightly above prior period.' },
      ],
      key_findings: [
        'Featured placement lifted registrations by ~12% over the control window.',
        'Early-bird tier captured 38% of total registrations.',
      ],
      recommendations: [
        'Increase featured-placement budget for the next cycle.',
        'Hold the early-bird tier at the same price point.',
      ],
    };
  },

  // 14. Recommend Events
  recommend_events: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const available = Array.isArray(input.available_events) ? (input.available_events as Array<Record<string, unknown>>) : [];
    const limit = typeof input.limit === 'number' ? Math.min(5, input.limit) : 5;
    const top = available.slice(0, limit);
    return {
      recommendations: top.map((e, i) => ({
        event_id: typeof e.id === 'string' ? e.id : `unknown-${i}`,
        title: typeof e.title === 'string' ? e.title : 'Event',
        match_score: Math.max(0.55, 0.95 - i * 0.08),
        reason: `Matches your interests in ${typeof e.category === 'string' ? e.category : 'this category'}.`,
      })),
    };
  },

  // 15. Search With NLP
  search_with_nlp: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const query = typeof input.query === 'string' ? input.query : '';
    const lower = query.toLowerCase();
    const keywords = lower.split(/\s+/).filter((w) => w.length > 2).slice(0, 8);

    // Naive filters derived from the query
    const categories: string[] = [];
    if (/tech|software|developer|code|ai|ml|devops|startup/i.test(lower)) categories.push('Technology');
    if (/music|concert|festival|dj|band/i.test(lower)) categories.push('Music');
    if (/business|networking|corporate|exec|leadership/i.test(lower)) categories.push('Business');
    if (/food|coffee|brunch|wine|culinary/i.test(lower)) categories.push('Food & Drink');
    if (/health|yoga|meditation|wellness|fitness/i.test(lower)) categories.push('Health & Wellness');

    const event_types: string[] = [];
    if (/conference|summit/i.test(lower)) event_types.push('conference');
    else if (/workshop|class|training/i.test(lower)) event_types.push('workshop');
    else if (/meetup|community/i.test(lower)) event_types.push('meetup');
    else if (/seminar|talk|lecture/i.test(lower)) event_types.push('seminar');

    const isFree = /free|no cost|gratis/i.test(lower);
    const price_range = isFree ? { min: 0, max: 0 } : undefined;

    const locations: string[] = [];
    if (/bole/i.test(lower)) locations.push('Bole');
    if (/kirkos/i.test(lower)) locations.push('Kirkos');
    if (/yeka/i.test(lower)) locations.push('Yeka');
    if (locations.length === 0) locations.push('Addis Ababa');

    return {
      interpreted_query: query.trim(),
      filters: {
        ...(categories.length > 0 ? { categories } : {}),
        ...(event_types.length > 0 ? { event_types } : {}),
        ...(locations.length > 0 ? { locations } : {}),
        ...(price_range ? { price_range } : {}),
        ...(keywords.length > 0 ? { tags: keywords } : {}),
      },
      keywords,
      intent: /recommend|suggest|for me/i.test(lower) ? 'recommendation' : 'search',
    };
  },

  // 16. Generate Platform Health
  generate_platform_health: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const period = typeof input.period_label === 'string' ? input.period_label : 'this period';
    return {
      status: 'healthy',
      summary:
        `Platform is healthy across ${period}. Registration volume is on plan, the moderation queue is ` +
        'well under capacity, and no error-rate regressions are showing in the last 24 hours.',
      highlights: [
        { metric: 'New users', value: '512', status: 'good' },
        { metric: 'Revenue', value: 'ETB 1.2M', status: 'good' },
        { metric: 'Pending moderations', value: '4', status: 'good' },
        { metric: 'System errors', value: '0.02%', status: 'good' },
      ],
      action_items: [
        'Review the two flagged organizer applications in the verification queue.',
        'Schedule a maintenance window for the audit-log index.',
      ],
    };
  },

  // 17. Analyze Audit Log
  analyze_audit_log: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const period = typeof input.period_label === 'string' ? input.period_label : 'this period';
    return {
      summary:
        `Audit activity for ${period} is consistent with prior periods. No anomalies suggesting ` +
        'coordinated abuse, and the compliance posture is unchanged.',
      patterns: [
        { pattern: 'Event approvals', severity: 'info', count: 18 },
        { pattern: 'Organizer verifications', severity: 'info', count: 3 },
        { pattern: 'Failed payouts (retried)', severity: 'warning', count: 1 },
      ],
      anomalies: [
        'A single IP address submitted 6 registration attempts in 90 seconds — flagged for review.',
      ],
      recommendations: [
        'Tighten the rate limit on registration for unverified sessions.',
      ],
      compliance_status: 'compliant',
    };
  },

  // 18. Generate Event Recap
  generate_event_recap: (messages) => {
    const input = extractUserJson(messages) ?? {};
    const title = typeof input.event_title === 'string' ? input.event_title : 'This event';
    return {
      recap_title: `What happened at ${title}`,
      recap_body:
        `From the opening keynote to the closing networking hour, ${title} brought together a ` +
        'remarkably engaged audience. The breakout sessions were standing-room-only, the energy in the ' +
        'main hall carried through to the end, and the post-event survey came back overwhelmingly positive. ' +
        'We are already looking forward to the next edition.',
      key_stats: [
        { label: 'Attendees', value: '412' },
        { label: 'Sessions', value: '14' },
        { label: 'Speakers', value: '9' },
        { label: 'Net Promoter', value: '+62' },
      ],
      highlights: [
        'The hands-on workshop track was the runaway favorite.',
        'The closing panel sparked the most active Q&A of the day.',
      ],
      thank_you_message: 'Thank you for being part of this — see you at the next one.',
    };
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the deterministic stub output for a given task. The `messages`
 * argument is the same chat-completion message list the live provider
 * would receive; the fixture may reflect the user input where useful.
 */
export function getStubResponse<T extends AITask>(
  task: T,
  messages: readonly AIMessage[]
): StubOutputMap[T] {
  const fn = fixtures[task];
  return fn(messages) as StubOutputMap[T];
}
