// ============================================================================
// Service: Analyze Audit Log
// Model Tier: heavy | Cache TTL: none (audit logs are real-time)
// ============================================================================
import { callAI } from '../client';
const SYSTEM_PROMPT = `You are an audit log analyst for Eventology, an event management platform in Addis Ababa, Ethiopia.
Analyze audit log entries to identify:
- Security patterns and anomalies
- Compliance issues
- Operational inefficiencies
- Suspicious admin behavior
- Policy violations

Focus areas:
- security: Unauthorized access attempts, privilege escalation, suspicious patterns
- compliance: Data handling violations, policy breaches, regulatory issues
- operations: Workflow bottlenecks, error patterns, process gaps
- all: Comprehensive analysis across all areas

Ethiopian context:
- Consider local business hours and working patterns
- Ethiopian holidays may explain activity gaps
- Mobile-first usage patterns are normal

Always respond with valid JSON in this format:
{
  "summary": "2-3 sentence overview of audit findings",
  "patterns": [
    { "pattern": "Pattern description", "severity": "info|warning|critical", "count": 5 }
  ],
  "anomalies": ["anomaly 1", "anomaly 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "compliance_status": "compliant|needs_review|non_compliant"
}`;
function buildUserPrompt(input) {
    return `Analyze ${input.entries.length} audit log entries for ${input.period_label}:
${input.focus ? `Focus: ${input.focus}` : 'Focus: all'}

Entries:
${input.entries
        .map((e) => `- [${e.created_at}] ${e.action} → ${e.target_type}${e.target_label ? ` (${e.target_label})` : ''}${e.details ? ` — ${e.details}` : ''}`)
        .join('\n')}`;
}
/**
 * Analyzes audit log entries for patterns, anomalies, and compliance.
 * NEVER cached — audit analysis must be fresh.
 * Returns null on failure.
 */
export async function analyzeAuditLog(input) {
    try {
        const response = await callAI({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(input) },
            ],
            modelTier: 'heavy',
            response_format: { type: 'json_object' },
            max_tokens: 3000,
        });
        return JSON.parse(response.content);
    }
    catch (err) {
        console.warn('[AI] analyzeAuditLog failed:', err instanceof Error ? err.message : 'Unknown error');
        return null;
    }
}
//# sourceMappingURL=analyze-audit-log.js.map