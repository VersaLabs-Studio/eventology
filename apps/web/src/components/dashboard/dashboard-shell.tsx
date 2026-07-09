"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { DashboardSidebar } from "./sidebar";
import { DashboardTopbar } from "./topbar";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/shared/logo";

type Variant = "org" | "admin";

interface DashboardShellProps {
  variant: Variant;
  children: React.ReactNode;
}

const COLLAPSE_KEY = "dash-sidebar-collapsed";

export function DashboardShell({ variant, children }: DashboardShellProps) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Hydrate collapsed state from localStorage (client-only).
  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === "true") setCollapsed(true);
    } catch {
      /* localStorage unavailable — non-fatal */
    }
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        /* non-fatal */
      }
      return next;
    });
  }, []);

  // Close the mobile drawer on navigation.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <DashboardSidebar
          variant={variant}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 z-[210] md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-border/60 bg-card/80 backdrop-blur-xl">
                <Logo size="sm" />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("navbar.closeMenu")}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="h-[calc(100%-4rem)]">
                <DashboardSidebar variant={variant} collapsed={false} showCollapseToggle={false} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopbar variant={variant} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
