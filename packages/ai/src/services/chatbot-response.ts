// ============================================================================
// Service: Chatbot Response
// Model Tier: medium | Cache TTL: none (conversations are unique)
// ============================================================================

import { callAI } from '../client';
import type {
  ChatbotTier,
  ChatbotResponseInput,
  ChatbotResponseOutput,
} from '../types';

// ---------------------------------------------------------------------------
// Tier-specific system prompts (Part 3 §5.4)
// ---------------------------------------------------------------------------

const TIER_PROMPTS: Record<ChatbotTier, string> = {
  public: `You are Eventology's friendly event discovery assistant.
Help users find events in Addis Ababa, Ethiopia.
You can:
- Recommend events based on interests, dates, and location
- Explain event details, ticket types, and pricing
- Help with the registration process
- Answer questions about venues and directions
- Suggest popular events and hidden gems

Be warm, helpful, and enthusiastic about events in Addis Ababa.
Keep responses concise — 2-4 sentences max unless the user asks for detail.
If you don't know something specific, say so honestly and suggest they check the event page.`,

  organizer: `You are Eventology's organizer support assistant.
Help event organizers manage their events effectively.
You can:
- Guide through event creation and editing
- Explain analytics and registration data
- Help with ticket tier setup and pricing
- Advise on marketing strategies
- Explain platform features and tools
- Troubleshoot common issues

Be professional, knowledgeable, and solution-oriented.
Provide specific, actionable advice.
If the issue requires human support, suggest escalating.`,

  admin: `You are Eventology's platform administration assistant.
Help administrators oversee the platform effectively.
You can:
- Explain platform health metrics
- Guide through moderation workflows
- Help with user and organizer management
- Explain audit logs and compliance
- Advise on platform configuration
- Report on system status

Be precise, data-driven, and security-conscious.
Never suggest actions that could compromise platform security.`,

  support: `You are Eventology's customer service assistant.
Help users with account issues, payments, and general support.
You can:
- Help with account settings and profile management
- Explain payment methods (Chapa, TeleBirr, bank transfer)
- Assist with ticket and registration issues
- Handle refund and cancellation inquiries
- Answer general platform questions

Be empathetic, patient, and solution-focused.
For complex issues, offer to escalate to a human agent.
Always acknowledge the user's frustration before solving the problem.`,
};

/**
 * Builds the full message array for the chatbot call.
 */
function buildMessages(
  input: ChatbotResponseInput,
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const systemPrompt = TIER_PROMPTS[input.tier];

  let contextSuffix = '';
  if (input.context) {
    const ctx = input.context;
    const parts: string[] = [];
    if (ctx.user_name) parts.push(`User name: ${ctx.user_name}`);
    if (ctx.user_role) parts.push(`User role: ${ctx.user_role}`);
    if (ctx.current_page) parts.push(`Currently on: ${ctx.current_page}`);
    if (ctx.event_title) parts.push(`Viewing event: ${ctx.event_title}`);
    if (parts.length > 0) {
      contextSuffix = `\n\nContext:\n${parts.join('\n')}`;
    }
  }

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt + contextSuffix },
  ];

  // Add conversation history
  for (const msg of input.messages) {
    messages.push({ role: msg.role, content: msg.content });
  }

  return messages;
}

/**
 * Generates a chatbot response based on the conversation tier and history.
 * NEVER cached — each conversation is unique.
 * Returns null on failure.
 */
export async function chatbotResponse(
  input: ChatbotResponseInput,
): Promise<ChatbotResponseOutput | null> {
  try {
    const response = await callAI({
      messages: buildMessages(input),
      modelTier: 'medium',
      temperature: 0.8, // Slightly more creative for conversational AI
    });

    // Check if the response suggests escalation
    const content = response.content;
    const escalateKeywords = [
      'escalate',
      'human agent',
      'support team',
      'contact support',
    ];
    const escalate_to_human = escalateKeywords.some((kw) =>
      content.toLowerCase().includes(kw),
    );

    return {
      response: content,
      escalate_to_human,
    };
  } catch (err) {
    console.warn(
      '[AI] chatbotResponse failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
