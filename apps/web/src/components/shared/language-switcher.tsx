"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { useLocale, LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * R3 / A2 — Persistent language switcher.
 *
 * Persists the user's choice to both a cookie (SSR-readable on the
 * next request) and localStorage (instant client read). Renders a
 * two-button pill so the user always sees the OTHER option (vs the
 * "select the active one" pattern, which is harder to discover).
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, ready } = useLocale();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  // Close on outside click + Escape
  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
        className="h-10 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/80 transition-all flex items-center gap-2 border border-border/50 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Languages className="h-4 w-4 text-primary" />
        <span>{LOCALE_NAMES[locale]}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-2 w-44 bg-card border border-border/80 rounded-2xl shadow-xl p-1 z-[120] backdrop-blur-xl"
        >
          {LOCALES.map((l) => {
            const isActive = l === locale;
            return (
              <li key={l} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l as Locale);
                    setOpen(false);
                  }}
                  disabled={!ready && isActive}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <span>{LOCALE_NAMES[l]}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {l.toUpperCase()}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
