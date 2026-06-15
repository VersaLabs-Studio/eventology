"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, Monitor, LayoutDashboard, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useLocale } from "@/lib/i18n";

const navLinks = [
  { href: "/events", labelKey: "nav.home" },
  { href: "/events?featured=true", labelKey: "events.featured" },
  { href: "/search", labelKey: "nav.search" },
];

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer automatically on path navigation changes
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is opened
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed w-full md:sticky top-0 z-[100] bg-background md:bg-background/80 backdrop-blur-xl border-b border-border/60 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Logo size="default" />

          {/* Desktop Central Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-muted/40 p-1 rounded-full border border-border/40 backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href.includes("?") && pathname.startsWith("/events"));
              return (
                <Link
                  key={link.labelKey}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 select-none",
                    isActive
                      ? "text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && mounted && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary rounded-full -z-10 shadow-glow"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{t(link.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Controls Panel */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative group">
              <button className="h-10 px-3.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/80 transition-all flex items-center gap-2 border border-border/50 backdrop-blur-sm">
                <Monitor className="h-4 w-4 text-primary" />
                <span>Switch Role</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border/80 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110] backdrop-blur-xl">
                <div className="text-[10px] font-extrabold text-muted-foreground px-3 py-1 uppercase tracking-wider">
                  Select Context
                </div>
                <Link href="/" className="flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors group/item">
                  <span className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5" /> Attendee</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </Link>
                <Link href="/org/dashboard" className="flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-accent/10 hover:text-accent transition-colors group/item">
                  <span className="flex items-center gap-2"><LayoutDashboard className="h-3.5 w-3.5" /> Organizer</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </Link>
                <Link href="/admin/dashboard" className="flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors group/item">
                  <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Admin</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>
            
            <div className="h-4 w-[1px] bg-border/80" />

            <LanguageSwitcher />

            <div className="h-4 w-[1px] bg-border/80" />

            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="font-bold text-xs h-9 rounded-xl">Log In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="accent" size="sm" className="font-extrabold text-xs h-9 rounded-xl shadow-accent-glow">Sign Up</Button>
            </Link>
          </div>

          {/* Mobile Drawer Trigger with minimum 44px touch region rules */}
          <button
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted border border-border/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setMobileOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>

      {/* iPadOS / Apple Silicon Inspired Dynamic Slide-out Drawer Panel */}
      <AnimatePresence>
        {mobileOpen && mounted && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Side Drawer Viewport */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-[300px] sm:w-[360px] z-[210] bg-card border-l border-border/60 p-6 flex flex-col justify-between md:hidden shadow-2xl overflow-y-auto"
            >
              <div className="flex flex-col gap-8">
                {/* Drawer Top Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <Logo size="sm" />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close mobile menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Primary Nav Stack */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                    Navigation
                  </span>
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.labelKey}
                        href={link.href}
                        className={cn(
                          "min-h-[44px] flex items-center px-4 rounded-xl text-base font-bold transition-all",
                          isActive
                            ? "bg-primary/10 text-primary font-extrabold"
                            : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        {t(link.labelKey)}
                      </Link>
                    );
                  })}
                </div>

                {/* Role Switcher Stack */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                    Platform Context
                  </span>
                  <Link href="/" className="min-h-[44px] flex items-center justify-between px-4 rounded-xl text-sm font-bold bg-muted/30 hover:bg-primary/10 hover:text-primary transition-colors group">
                    <span className="flex items-center gap-3"><Monitor className="h-4 w-4 text-primary" /> Attendee View</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/org/dashboard" className="min-h-[44px] flex items-center justify-between px-4 rounded-xl text-sm font-bold bg-muted/30 hover:bg-accent/10 hover:text-accent transition-colors group">
                    <span className="flex items-center gap-3"><LayoutDashboard className="h-4 w-4 text-accent" /> Organizer View</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/admin/dashboard" className="min-h-[44px] flex items-center justify-between px-4 rounded-xl text-sm font-bold bg-muted/30 hover:bg-destructive/10 hover:text-destructive transition-colors group">
                    <span className="flex items-center gap-3"><Shield className="h-4 w-4 text-destructive" /> Admin View</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="flex flex-col gap-3 pt-6 border-t border-border/40 mt-8">
                <Link href="/auth/login" className="w-full">
                  <Button variant="outline" className="w-full min-h-[44px] rounded-xl font-bold text-sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth/signup" className="w-full">
                  <Button variant="accent" className="w-full min-h-[44px] rounded-xl font-extrabold text-sm shadow-accent-glow">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

