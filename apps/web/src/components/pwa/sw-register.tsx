'use client';

// ============================================================================
// SW Register — registers the hand-rolled service worker + update prompt
// (HO-L)
// ============================================================================
// Update flow (LOCKED): a newly-installed worker WAITS; this component
// surfaces an explicit "New version available — reload" prompt. Accepting
// posts SKIP_WAITING to the waiting worker and reloads once on
// controllerchange. Users are never silently stranded on a stale build,
// and never force-updated mid-task.
// ============================================================================

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { RefreshCw, X } from "lucide-react";

export function SWRegister() {
  const { t } = useLocale();
  const [updateReady, setUpdateReady] = React.useState(false);
  const reloading = React.useRef(false);

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const onControllerChange = () => {
      // The new worker took over after the user accepted the update.
      if (reloading.current) return;
      reloading.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;

        // A worker is already waiting (e.g. the prompt was missed).
        if (reg.waiting && navigator.serviceWorker.controller) {
          setUpdateReady(true);
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            // Only prompt when there is an EXISTING controller — the very
            // first install is silent.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        // SW registration is best-effort — the app works without it.
      });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      void registration;
    };
  }, []);

  const acceptUpdate = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    // controllerchange (registered above) performs the reload.
  };

  const dismissUpdate = () => setUpdateReady(false);

  return (
    <AnimatePresence>
      {updateReady && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] rounded-2xl border border-border bg-card shadow-xl px-4 py-3 flex items-center gap-3 max-w-sm mx-4"
          role="alert"
        >
          <RefreshCw className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium flex-1">{t('pwa.newVersion')}</p>
          <Button size="sm" className="rounded-xl font-bold" onClick={acceptUpdate}>
            {t('pwa.reload')}
          </Button>
          <button
            onClick={dismissUpdate}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('pwa.dismiss')}
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
