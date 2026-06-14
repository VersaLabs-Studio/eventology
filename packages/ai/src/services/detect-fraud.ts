// ============================================================================
// Service: Detect Fraud
// Model Tier: heavy | Cache TTL: none (never cache fraud detection)
// ============================================================================

import { callAI } from '../client';
import type {
  DetectFraudInput,
  DetectFraudOutput,
} from '../types';

const SYSTEM_PROMPT = `You are a fraud detection AI for Eventology, an event management platform in Addis Ababa, Ethiopia.
Analyze user actions for suspicious patterns:
- Rapid-fire registrations from same IP/device
- Suspicious promo code usage patterns
- Unusual payment behavior
- Bot-like activity patterns
- Account takeover indicators
- Ticket scalping indicators

Consider Ethiopian context:
- Mobile money (TeleBirr) is common — don't flag normal mobile usage
- Shared devices are common in Ethiopia — consider cultural context
- Bulk registrations for corporate events are legitimate

Always respond with valid JSON in this format:
{
  "is_suspicious": false,
  "risk_score": 0.15,
  "flags": ["flag1"],
  "recommended_action": "allow|flag|block|review",
  "reason": "Explanation"
}`;

function buildUserPrompt(input: DetectFraudInput): string {
  return `Analyze this action for fraud:

Action Type: ${input.action_type}
User ID: ${input.user_id}
${input.ip_address ? `IP: ${input.ip_address}` : ''}
${input.device_fingerprint ? `Device: ${input.device_fingerprint}` : ''}
Metadata: ${JSON.stringify(input.metadata)}
${input.recent_actions?.length ? `Recent actions: ${JSON.stringify(input.recent_actions)}` : ''}`;
}

/**
 * Detects potentially fraudulent user actions.
 * NEVER cached — fraud detection must analyze each action fresh.
 * Returns null on failure (default to allow to avoid blocking legitimate users).
 */
export async function detectFraud(
  input: DetectFraudInput,
): Promise<DetectFraudOutput | null> {
  try {
    const response = await callAI({
      task: 'detect_fraud',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'heavy',
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.content) as DetectFraudOutput;
  } catch (err) {
    console.warn(
      '[AI] detectFraud failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    // Default to allow on failure — manual review catches edge cases
    return null;
  }
}
