"use client";

// ============================================================================
// OrganizerAiPanel — organizer-facing AI studio
// ============================================================================
// Surfaces four of the organizer-assist AI tasks that had services + a route
// (/api/protected/ai/organizer) but no UI: marketing copy, pricing optimizer,
// performance predictor, and attendee insights. Each card fires one task and
// renders the structured result. Best-effort — a null/failed result shows an
// inline retry, never blocks the page. Ownership + rate limits are enforced
// server-side by the route.
// ============================================================================

import * as React from "react";
import { Sparkles, Megaphone, Tag, TrendingUp, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  eventId: string;
  title: string;
  eventType: string;
  description: string;
  category: string;
  capacity: number;
  registrationsCount: number;
  startDate: string;
  isFeatured: boolean;
}

type TaskKey = "marketing" | "pricing" | "prediction" | "insights";

interface TaskDef {
  key: TaskKey;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TASKS: TaskDef[] = [
  { key: "marketing", label: "Marketing copy", hint: "Ready-to-post social announcement", icon: Megaphone },
  { key: "pricing", label: "Pricing optimizer", hint: "Suggested tiers for your audience", icon: Tag },
  { key: "prediction", label: "Performance predictor", hint: "Projected attendance & risk", icon: TrendingUp },
  { key: "insights", label: "Attendee insights", hint: "Patterns from your registrations", icon: Users },
];

function daysUntil(startDate: string): number {
  const start = new Date(startDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((start - now) / 86_400_000));
}

export function OrganizerAiPanel(props: Props) {
  const [busy, setBusy] = React.useState<TaskKey | null>(null);
  const [results, setResults] = React.useState<Partial<Record<TaskKey, unknown>>>({});
  const [errors, setErrors] = React.useState<Partial<Record<TaskKey, boolean>>>({});

  function buildInput(task: TaskKey): Record<string, unknown> {
    switch (task) {
      case "marketing":
        return {
          event_title: props.title,
          event_description: props.description,
          event_type: props.eventType,
          target_audience: "general",
          platform: "social",
          tone: "exciting",
        };
      case "pricing":
        return {
          event_type: props.eventType,
          category: props.category,
          venue_capacity: props.capacity,
          target_audience: "general",
          organizer_tier: "new",
        };
      case "prediction":
        return {
          event_title: props.title,
          event_type: props.eventType,
          days_until_event: daysUntil(props.startDate),
          current_registrations: props.registrationsCount,
          capacity: props.capacity,
          views_trend: [],
          registrations_trend: [],
          is_featured: props.isFeatured,
        };
      case "insights":
        return {
          event_title: props.title,
          total_registrations: props.registrationsCount,
          checked_in_count: 0,
          cancelled_count: 0,
          ticket_tiers: [],
          registration_dates: [],
        };
    }
  }

  async function run(task: TaskKey) {
    setBusy(task);
    setErrors((e) => ({ ...e, [task]: false }));
    try {
      const res = await fetch("/api/protected/ai/organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ task, event_id: props.eventId, input: buildInput(task) }),
      });
      const json = (await res.json()) as { ok?: boolean; data?: unknown };
      if (!res.ok || !json.data || Object.keys(json.data as object).length === 0) {
        setErrors((e) => ({ ...e, [task]: true }));
      } else {
        setResults((r) => ({ ...r, [task]: json.data }));
      }
    } catch {
      setErrors((e) => ({ ...e, [task]: true }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg leading-tight">AI Studio</h3>
          <p className="text-sm text-muted-foreground">Generate copy, pricing, and forecasts for this event.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TASKS.map((task) => {
          const Icon = task.icon;
          const result = results[task.key];
          const isBusy = busy === task.key;
          return (
            <div key={task.key} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{task.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{task.hint}</p>
                  </div>
                </div>
                <Button size="sm" variant={result ? "outline" : "default"} disabled={isBusy} onClick={() => run(task.key)}>
                  {isBusy ? (
                    <>
                      <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" /> Working…
                    </>
                  ) : result ? (
                    "Regenerate"
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>

              {errors[task.key] && !result ? (
                <p className="text-xs text-muted-foreground">Couldn&apos;t generate right now. Try again.</p>
              ) : null}

              {result ? <TaskResult task={task.key} data={result} /> : null}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground italic">AI-generated · review before publishing.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-task result renderers
// ---------------------------------------------------------------------------

function TaskResult({ task, data }: { task: TaskKey; data: unknown }) {
  const d = data as Record<string, unknown>;

  if (task === "marketing") {
    return (
      <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-1">
        {d.subject ? <p className="font-semibold">{String(d.subject)}</p> : null}
        {d.headline ? <p className="font-semibold">{String(d.headline)}</p> : null}
        {d.body ? <p className="text-muted-foreground whitespace-pre-wrap">{String(d.body)}</p> : null}
        {d.cta ? <p className="font-medium text-primary">{String(d.cta)}</p> : null}
      </div>
    );
  }

  if (task === "pricing") {
    const tiers = Array.isArray(d.tiers) ? (d.tiers as Array<Record<string, unknown>>) : [];
    return (
      <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-2">
        {tiers.map((t, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="font-medium">{String(t.name ?? t.tier_name ?? `Tier ${i + 1}`)}</span>
            <span className="text-primary font-semibold">{String(t.suggested_price ?? t.price ?? "")}</span>
          </div>
        ))}
        {d.general_advice ? <p className="text-muted-foreground">{String(d.general_advice)}</p> : null}
        {d.confidence ? <ConfidenceBadge value={String(d.confidence)} /> : null}
      </div>
    );
  }

  if (task === "prediction") {
    const suggestions = Array.isArray(d.suggestions) ? (d.suggestions as string[]) : [];
    return (
      <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Metric label="Projected" value={String(d.predicted_attendance ?? "—")} />
          <Metric label="Fill rate" value={`${d.fill_rate_percent ?? "—"}%`} />
          <Metric label="Risk" value={String(d.risk_level ?? "—")} />
        </div>
        {suggestions.length > 0 ? <BulletList items={suggestions} /> : null}
        {d.confidence ? <ConfidenceBadge value={String(d.confidence)} /> : null}
      </div>
    );
  }

  // insights
  const insights = Array.isArray(d.insights) ? (d.insights as string[]) : [];
  const recs = Array.isArray(d.recommendations) ? (d.recommendations as string[]) : [];
  return (
    <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Metric label="Attendance rate" value={`${d.attendance_rate ?? "—"}%`} />
        {d.peak_registration_period ? <Metric label="Peak" value={String(d.peak_registration_period)} /> : null}
      </div>
      {insights.length > 0 ? <BulletList items={insights} /> : null}
      {recs.length > 0 ? (
        <div>
          <p className="font-medium mt-1">Recommendations</p>
          <BulletList items={recs} />
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold capitalize">{value}</span>
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function ConfidenceBadge({ value }: { value: string }) {
  return (
    <span className="inline-block text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
      Confidence: {value}
    </span>
  );
}
