"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NLPSearchResult {
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
}

interface NLPSearchResponse {
  ok: boolean;
  data: NLPSearchResult | null;
  reason?: string;
}

/**
 * "✨ AI Interpret" affordance for the search page. Calls
 * /api/public/search/interpret, displays the interpreted filters in a
 * premium card. If the AI is unavailable, falls back to a "we used
 * your literal terms" message — no error.
 */
export function AISearchPanel({
  query,
  onApply,
}: {
  query: string;
  onApply: (filters: NLPSearchResult["filters"]) => void;
}) {
  const [result, setResult] = React.useState<NLPSearchResult | null>(null);
  const [fallback, setFallback] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function interpret() {
    if (!query.trim()) return;
    setLoading(true);
    setFallback(false);
    try {
      const res = await fetch("/api/public/search/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const body = (await res.json()) as NLPSearchResponse;
      if (body.ok && body.data) {
        setResult(body.data);
        setFallback(false);
      } else {
        setResult(body.data ?? null);
        setFallback(true);
      }
    } catch {
      setFallback(true);
    } finally {
      setLoading(false);
    }
  }

  if (!query.trim()) return null;

  return (
    <div className="mb-6">
      {!result && !loading && (
        <Button
          variant="outline"
          size="sm"
          onClick={interpret}
          className="rounded-full border-primary/30 hover:border-primary/60"
        >
          <Sparkles className="h-4 w-4 mr-2 text-primary" />
          AI Interpret
        </Button>
      )}

      {loading && (
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Interpreting your search…
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold uppercase tracking-wider text-primary mb-1">
                  {fallback ? "Plain search" : "AI interpreted"}
                </div>
                <p className="text-sm text-foreground font-medium mb-2">
                  {fallback
                    ? `We'll search for "${query}" as plain keywords.`
                    : `Looking for: ${result.interpreted_query}`}
                </p>
                {Object.keys(result.filters).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {result.filters.categories?.map((c) => (
                      <span
                        key={`c-${c}`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {c}
                      </span>
                    ))}
                    {result.filters.event_types?.map((t) => (
                      <span
                        key={`t-${t}`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent capitalize"
                      >
                        {t}
                      </span>
                    ))}
                    {result.filters.locations?.map((l) => (
                      <span
                        key={`l-${l}`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {l}
                      </span>
                    ))}
                    {result.filters.tags?.slice(0, 4).map((tg) => (
                      <span
                        key={`tg-${tg}`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                )}
                {!fallback && Object.keys(result.filters).length > 0 && (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => onApply(result.filters)}
                    className="rounded-full text-xs font-extrabold"
                  >
                    Apply filters
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
