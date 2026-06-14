// ============================================================================
// Service: Generate Report
// Model Tier: heavy | Cache TTL: 1h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  GenerateReportInput,
  GenerateReportOutput,
} from '../types';

const CACHE_TTL_SECONDS = 1 * 60 * 60; // 1 hour

const SYSTEM_PROMPT = `You are a report writer for Eventology, an event management platform in Addis Ababa, Ethiopia.
Generate professional, structured reports based on provided data.
Your reports should:
- Start with a clear executive summary
- Organize information into logical sections
- Include data-backed key findings
- Provide actionable recommendations
- Use professional but accessible language
- Be appropriate for the target audience (organizer, admin, or external)

Always respond with valid JSON in this format:
{
  "title": "Report title",
  "executive_summary": "2-3 sentence summary of key findings",
  "sections": [
    { "heading": "Section Title", "content": "Section content" }
  ],
  "key_findings": ["finding 1", "finding 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

function buildUserPrompt(input: GenerateReportInput): string {
  return `Generate a ${input.report_type} report:

Title: ${input.title}
Period: ${input.period.start} to ${input.period.end}
Audience: ${input.audience}
Data:
${JSON.stringify(input.data, null, 2)}`;
}

/**
 * Generates a structured report from provided data.
 * Returns null on failure.
 */
export async function generateReport(
  input: GenerateReportInput,
): Promise<GenerateReportOutput | null> {
  try {
    const cacheKey = `report:${input.report_type}:${hashPrompt(JSON.stringify(input))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as GenerateReportOutput;

    const response = await callAI({
      task: 'generate_report',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'heavy',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.content) as GenerateReportOutput;

    await setCachedResponse(
      cacheKey,
      response.content,
      response.model_used,
      hashPrompt(JSON.stringify(input)),
      response.tokens_used,
      response.latency_ms,
      CACHE_TTL_SECONDS,
    );

    return result;
  } catch (err) {
    console.warn(
      '[AI] generateReport failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
