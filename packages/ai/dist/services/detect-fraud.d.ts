import type { DetectFraudInput, DetectFraudOutput } from '../types';
/**
 * Detects potentially fraudulent user actions.
 * NEVER cached — fraud detection must analyze each action fresh.
 * Returns null on failure (default to allow to avoid blocking legitimate users).
 */
export declare function detectFraud(input: DetectFraudInput): Promise<DetectFraudOutput | null>;
//# sourceMappingURL=detect-fraud.d.ts.map