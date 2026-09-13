'use client';

// ============================================================================
// Install Prompt — beforeinstallprompt UI (HO-L)
// ============================================================================
// Dismissible (per-lock: `later`), remembered in localStorage. The native
// install flow carries no user data; this is presentation only.
// ============================================================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'eventology:pwa-install-dismissed';

export function InstallPrompt() {
  const { t } = useLocale();
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return;

    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep our own UI in control
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // Already installed (standalone) → never show.
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setVisible(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // private mode — dismissal just won't persist
    }
  };

  return (
    <AnimatePresence>
      {visible && deferred && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-4 right-4 z-[100] rounded-2xl border border-border bg-card shadow-xl px-4 py-3 flex items-center gap-3 max-w-sm"
          role="dialog"
          aria-label={t('pwa.installTitle')}
        >
          <Download className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{t('pwa.installTitle')}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{t('pwa.installBody')}</p>
          </div>
          <Button size="sm" className="rounded-xl font-bold shrink-0" onClick={install}>
            {t('pwa.install')}
          </Button>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label={t('pwa.later')}
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
