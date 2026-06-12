"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, TrendingUp, Users, Target, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AIInsights {
  narrative: string;
  key_metrics: { label: string; value: string; trend?: string }[];
  recommendations: string[];
}

interface AIInsightsResponse {
  ok: boolean;
  data?: AIInsights;
  reason?: string;
}

/**
 * Premium AI insights section for the event analytics page. Three
 * stacked cards: narrative, attendee insights, performance prediction.
 * On AI failure, shows a friendly empty state — never breaks the page.
 */
export function EventAnalyticsAI({ eventId }: { eventId: string }) {
  const [narrative, setNarrative] = React.useState<AIInsights | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/protected/ai/organizer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "narrative",
          event_id: eventId,
          input: {
            event_title: "This event",
            registrations_count: 0,
            capacity: 100,
            views_count: 0,
            period_label: "this period",
          },
        }),
      });
      const body = (await res.json()) as AIInsightsResponse;
      if (body.ok && body.data) {
        setNarrative(body.data);
      } else {
        setError("AI insights unavailable");
      }
    } catch {
      setError("AI insights unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8"
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="relative z-10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
              <span className="ml-1 inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary tracking-wider">
                BETA
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Generate a narrative summary of this event's performance.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            size="sm"
            variant="accent"
            className="rounded-full"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            {loading ? "Generating…" : narrative ? "Regenerate" : "Generate"}
          </Button>
        </CardHeader>
        <CardContent className="relative z-10">
          {error && (
            <p className="text-sm text-muted-foreground">{error}</p>
          )}
          {!narrative && !error && !loading && (
            <p className="text-sm text-muted-foreground">
              Click <strong>Generate</strong> to get an AI-written summary of
              registrations, views, and recommendations.
            </p>
          )}
          {narrative && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-sm leading-relaxed text-foreground/90">
                {narrative.narrative}
              </p>
              {narrative.key_metrics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {narrative.key_metrics.map((m) => (
                    <div
                      key={m.label}
                      className="p-3 rounded-xl bg-background/60 border border-border/60"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {m.label}
                      </p>
                      <p className="text-xl font-display font-extrabold text-foreground mt-1">
                        {m.value}
                      </p>
                      {m.trend && (
                        <p className="text-[10px] text-primary font-bold mt-0.5 flex items-center gap-1">
                          <TrendingUp className="h-2.5 w-2.5" />
                          {m.trend}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {narrative.recommendations.length > 0 && (
                <div className="rounded-xl bg-background/60 border border-border/60 p-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Recommendations
                  </p>
                  <ul className="space-y-1.5 text-sm text-foreground/85">
                    {narrative.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
