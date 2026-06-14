"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type AIGenerateField = "description" | "tags";

export interface AIGenerateResult {
  description?: string;
  short_description?: string;
  tags?: string[];
}

interface AIGenerateButtonProps {
  /** The AI task to dispatch (organizer route). */
  task: AIGenerateField | "description" | "tags" | "marketing" | "pricing";
  /** Inputs needed for the task. */
  input: Record<string, unknown>;
  /** Event id (required for organizer role guard on the route). */
  eventId?: string;
  /** Called when AI returns a result. */
  onResult: (result: AIGenerateResult) => void;
  /** Small label (default "Generate"). */
  label?: string;
  /** Variant — primary uses accent color. */
  variant?: "primary" | "subtle";
}

/**
 * Inline "✨ Generate" affordance. Fires the organizer AI route,
 * shows a spinner while waiting, and calls onResult with the parsed
 * response. On AI failure, shows a brief toast and leaves the form
 * untouched (no auto-overwrite).
 */
export function AIGenerateButton({
  task,
  input,
  eventId,
  onResult,
  label = "Generate",
  variant = "subtle",
}: AIGenerateButtonProps) {
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
        body: JSON.stringify({ task, event_id: eventId, input }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(body?.error?.message ?? "AI unavailable");
        return;
      }
      const body = (await res.json()) as { ok: boolean; data?: AIGenerateResult };
      if (!body.ok || !body.data) {
        setError("AI unavailable");
        return;
      }
      onResult(body.data);
    } catch {
      setError("AI unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all",
          variant === "primary"
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-primary/10 text-primary hover:bg-primary/20",
          loading && "opacity-70 cursor-wait"
        )}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {loading ? "Generating…" : label}
      </button>
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className="text-[10px] text-muted-foreground"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
