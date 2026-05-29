// ============================================================================
// Service: Moderate Content
// Model Tier: heavy | Cache TTL: none (never cache moderation results)
// ============================================================================

import { callAI } from '../client';
import type {
  ModerateContentInput,
  ModerateContentOutput,
} from '../types';

const SYSTEM_PROMPT = `You are a content moderation AI for Eventology, an event management platform in Addis Ababa, Ethiopia.
Your job is to detect:
- Hate speech, discrimination, or offensive language
- Spam, scam, or misleading content
- Adult/sexual content inappropriate for a professional platform
- Violence, threats, or harmful content
- Copyright infringement indicators
- Misinformation about events (fake venues, false claims)

Be sensitive to cultural context — Amharic phrases, Ethiopian cultural references,
and local expressions should NOT be flagged unless genuinely harmful.

Always respond with valid JSON in this format:
{
  "is_safe": true,
  "flags": ["flag1", "flag2"],
  "severity": "none|low|medium|high",
  "suggested_action": "approve|review|reject",
  "reason": "Explanation if flagged"
}`;

function buildUserPrompt(input: ModerateContentInput): string {
  return `Moderate this ${input.content_type}:

"${input.content}"
${input.context ? `\nContext: ${input.context}` : ''}`;
}

/**
 * Moderates content for safety and policy compliance.
 * NEVER cached — moderation must always run fresh.
 * Returns null on failure (default to safe to avoid blocking legitimate content).
 */
export async function moderateContent(
  input: ModerateContentInput,
): Promise<ModerateContentOutput | null> {
  try {
    const response = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'heavy',
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.content) as ModerateContentOutput;
  } catch (err) {
    console.warn(
      '[AI] moderateContent failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    // Default to safe on failure — manual review can catch edge cases
    return null;
  }
}
