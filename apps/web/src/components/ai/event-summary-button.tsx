"use client";

// ============================================================================
// EventSummaryButton — AI TL;DR on the public event page
// ============================================================================
// The web counterpart of the mobile EventSummaryCard. Signed-in users get a
// "Summarize with AI" button that calls POST /api/protected/ai/event-summary
// and renders a 2-3 sentence summary + highlight bullets. Best-effort: a 401
// prompts sign-in, any other failure shows a retry. Never blocks the page.
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Summary {
  summary: string;
  highlights: string[];
}

export function EventSummaryButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Summary | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  async function summarize() {
    setLoading(true);
    setFailed(false);
    setNeedsAuth(false);
    try {
      const res = await fetch("/api/protected/ai/event-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ event_id: eventId }),
      });
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const json = (await res.json()) as { ok?: boolean; data?: Summary | null };
      if (!res.ok || !json.data) {
        setFailed(true);
      } else {
        setData(json.data);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (data) {
    return (
      <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-sm">AI Summary</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
        {data.highlights.length > 0 && (
          <ul className="mt-3 space-y-1">
            {data.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground italic">AI-generated · may be imperfect</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Button variant="outline" size="sm" onClick={summarize} disabled={loading}>
        {loading ? (
          <>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Summarizing…
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Summarize with AI
          </>
        )}
      </Button>
      {needsAuth && (
        <p className="mt-2 text-xs text-muted-foreground">
          <Link href="/auth/login" className="text-primary underline underline-offset-2">
            Sign in
          </Link>{" "}
          to generate an AI summary.
        </p>
      )}
      {failed && <p className="mt-2 text-xs text-muted-foreground">Couldn&apos;t summarize right now. Try again.</p>}
    </div>
  );
}
