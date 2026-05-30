import type { AnalyzeAuditLogInput, AnalyzeAuditLogOutput } from '../types';
/**
 * Analyzes audit log entries for patterns, anomalies, and compliance.
 * NEVER cached — audit analysis must be fresh.
 * Returns null on failure.
 */
export declare function analyzeAuditLog(input: AnalyzeAuditLogInput): Promise<AnalyzeAuditLogOutput | null>;
//# sourceMappingURL=analyze-audit-log.d.ts.map