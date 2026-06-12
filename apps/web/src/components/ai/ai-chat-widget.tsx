"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatResponse {
  ok: boolean;
  session_id: string;
  tier: "public" | "organizer" | "admin";
  reply: string | null;
  escalate_to_human?: boolean;
  reason?: string;
}

interface SessionsResponse {
  data: Array<{
    id: string;
    title: string | null;
    tier: string;
    updated_at: string;
  }>;
}

/**
 * Premium floating chat widget. The tier is server-resolved from the
 * caller's role — the UI never asks for it, never lets the user set
 * it. The widget loads the user's recent sessions, lets them start
 * a new one, and falls back to a friendly "assistant unavailable"
 * state on AI failure.
 */
export function AIChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [tier, setTier] = React.useState<"public" | "organizer" | "admin" | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);
  const [escalate, setEscalate] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    // Auto-scroll on new messages
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [open, messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    setUnavailable(false);
    setEscalate(false);
    try {
      const res = await fetch("/api/protected/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId ?? undefined,
          message: text,
        }),
      });
      const body = (await res.json()) as ChatResponse;
      if (!body.ok || !body.reply) {
        setUnavailable(true);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "I'm having trouble responding right now. Try again in a moment, or talk to support." },
        ]);
        return;
      }
      setSessionId(body.session_id);
      setTier(body.tier);
      setEscalate(!!body.escalate_to_human);
      setMessages((m) => [...m, { role: "assistant", content: body.reply! }]);
    } catch {
      setUnavailable(true);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection issue. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function newSession() {
    setSessionId(null);
    setMessages([]);
    setUnavailable(false);
    setEscalate(false);
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-glow flex items-center justify-center transition-all",
          "bg-gradient-to-br from-primary to-accent text-primary-foreground hover:scale-105",
          open && "scale-90 opacity-0 pointer-events-none"
        )}
        aria-label="Open Eventology assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-3rem))] h-[min(600px,calc(100vh-3rem))] rounded-3xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-br from-primary via-emerald-600 to-accent text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <div>
                  <p className="font-extrabold text-sm">Eventology Assistant</p>
                  <p className="text-[10px] opacity-80 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Tier: {tier ?? "—"} · server-enforced
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={newSession}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/15 hover:bg-white/25"
                  title="Start a new conversation"
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center pt-6">
                  <div className="inline-flex h-12 w-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-foreground font-semibold">How can I help?</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    I can help you find events, navigate the platform, or answer organizer questions. Your conversation is private and persisted across sessions.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground"
                  )}
                >
                  {m.content}
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking…
                </div>
              )}
              {unavailable && (
                <div className="rounded-xl bg-muted/60 border border-border p-3 text-xs text-muted-foreground">
                  Assistant is currently unavailable. Your conversation is saved — try again in a moment.
                </div>
              )}
              {escalate && (
                <div className="rounded-xl bg-accent/10 border border-accent/30 p-3 text-xs">
                  <p className="font-extrabold text-accent mb-1">Need a human?</p>
                  <p className="text-foreground/80 mb-2">I can connect you with our support team.</p>
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-1 text-accent font-extrabold text-xs hover:underline"
                  >
                    Talk to support →
                  </a>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card/80 backdrop-blur">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask me anything…"
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={send}
                  size="icon"
                  disabled={!input.trim() || loading}
                  className="h-9 w-9 rounded-xl"
                  variant="accent"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
