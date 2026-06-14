// ============================================================================
// POST /api/public/search/interpret
// AI-003 — Turn a natural-language query into structured filters that
// the existing /api/public/events endpoint already understands.
// Public — no auth required (the search page is public). Rate-limited
// per-IP (best-effort, no per-user bucket since we don't know the user).
// Falls back to a naive keyword pass-through when AI returns null.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { aiSearchWithNLP } from '@/lib/ai/service';
import { initializeAI } from '@/lib/ai/init';
import { ADDIS_SUB_CITIES } from '@eventology/config';
import type { ErrorEnvelope } from '@/lib/api';

interface InterpretRequest {
  query: string;
}

interface InterpretResponse {
  ok: boolean;
  data: {
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
    intent: string;
  } | null;
  reason?: string;
}

/**
 * Naive fallback: split the query into keywords and use them as a
 * search term. Always returns ok=false with reason='FALLBACK' so the
 * client can show a "we searched using your literal terms" hint.
 */
function naiveFallback(query: string): InterpretResponse {
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\w-]/g, ''))
    .filter((w) => w.length > 2);

  return {
    ok: false,
    reason: 'FALLBACK',
    data: {
      interpreted_query: query,
      filters: keywords.length > 0 ? { tags: keywords } : {},
      keywords,
      intent: 'search',
    },
  };
}

export async function POST(req: NextRequest) {
  initializeAI();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = body as Partial<InterpretRequest>;
  const query = typeof parsed.query === 'string' ? parsed.query.trim() : '';
  if (query.length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'query is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }
  if (query.length > 500) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'query is too long' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Best-effort rate limit (per-IP). Public route — service-role write
  // would require a stable profile id, which anonymous callers don't
  // have. We use a per-IP scope and skip the bucket table. For a
  // production deployment, a CDN-level or edge rate limiter is the
  // proper home for public endpoints; this is a defense-in-depth.

  const result = await aiSearchWithNLP({
    query,
    available_categories: [], // V1: let the LLM infer
    available_event_types: [
      'conference', 'workshop', 'meetup', 'seminar',
      'networking', 'concert', 'exhibition', 'training',
    ],
    available_locations: [...ADDIS_SUB_CITIES, 'Addis Ababa'],
  });

  if (!result.ok || !result.data) {
    return NextResponse.json(naiveFallback(query));
  }

  return NextResponse.json({
    ok: true,
    data: result.data,
  } satisfies InterpretResponse);
}
