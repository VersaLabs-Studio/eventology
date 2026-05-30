import type { ChatbotResponseInput, ChatbotResponseOutput } from '../types';
/**
 * Generates a chatbot response based on the conversation tier and history.
 * NEVER cached — each conversation is unique.
 * Returns null on failure.
 */
export declare function chatbotResponse(input: ChatbotResponseInput): Promise<ChatbotResponseOutput | null>;
//# sourceMappingURL=chatbot-response.d.ts.map