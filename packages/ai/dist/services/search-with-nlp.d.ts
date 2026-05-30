import type { SearchWithNLPInput, SearchWithNLPOutput } from '../types';
/**
 * Interprets a natural language search query into structured filters.
 * NEVER cached — search queries are unique and context-dependent.
 * Returns null on failure.
 */
export declare function searchWithNLP(input: SearchWithNLPInput): Promise<SearchWithNLPOutput | null>;
//# sourceMappingURL=search-with-nlp.d.ts.map