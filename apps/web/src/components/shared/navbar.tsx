"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Menu, X, Monitor, LayoutDashboard, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { NotificationBell } from "@/components/comms/notification-bell";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/events", labelKey: "nav.events" },
  { href: "/search", labelKey: "nav.search" },
];

/**
 * R5: Active-state predicate. Splits the link href on "?" and requires the
 * pathname to match the path AND every query kv-pair to match
 * searchParams. Falls back to `false` when searchParams is null (defensive
 * SSR boundary). The previous inline predicate (`href.includes("?") &&
 * pathname.startsWith("/events")`) wrongly highlighted the Featured link on
 * the bare `/events` route AND on event-detail pages (`/events/123`),
 * producing duplicate active states and incorrect section highlighting.
 */
function isLinkActive(
  href: string,
  pathname: string,
  searchParams: URLSearchParams | null
): boolean {
  const [path, query] = href.split("?");
  if (pathname !== path) return false;
  if (!query) return true;
  if (!searchParams) return false;
  for (const kv of query.split("&")) {
    const [k, v] = kv.split("=");
    if (searchParams.get(k) !== v) return false;
  }
  return true;
}

/**
 * R5: Sub-component that uses `useSearchParams` so it can be wrapped in
 * `<Suspense>` at the parent. Next 14+ requires this — see
 * https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout.
 */
function DesktopNavLinks({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <nav className="hidden md:flex items-center gap-1.5 bg-muted/40 p-1 rounded-full border border-border/40 backdrop-blur-md">
      {navLinks.map((link) => {
        const isActive = isLinkActive(link.href, pathname, searchParams);
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
  );
}

/**
 * R5: Same Suspense boundary requirement as DesktopNavLinks. Renders the
 * nav stack inside the mobile slide-out drawer.
 */
function MobileNavLinks({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-3 mb-1">
        {t("navbar.navigation")}
      </span>
      {navLinks.map((link) => {
        const isActive = isLinkActive(link.href, pathname, searchParams);
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
  );
}

/**
 * R6: Auth-aware controls for the desktop header. Three states:
 *   1. isLoading → pulsing skeleton (never the stale Log In/Sign Up)
 *   2. !isAuthenticated → Log In + Sign Up buttons
 *   3. isAuthenticated → user menu (avatar/name → dropdown with links + logout)
 *
 * Role-aware: Organizer Dashboard shows only for organizer/admin; Admin
 * Dashboard only for admin. "Become an organizer" CTA shows for attendees.
 */
function DesktopAuthControls() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="hidden md:flex items-center gap-3">
        <div className="h-9 w-20 rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-9 w-24 rounded-xl bg-muted/60 animate-pulse" />
      </div>
    );
  }

  // ── Not authenticated ──
  if (!isAuthenticated || !user) {
    return (
      <div className="hidden md:flex items-center gap-3">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm" className="font-bold text-xs h-9 rounded-xl">{t("nav.login")}</Button>
        </Link>
        <Link href="/auth/signup">
          <Button variant="accent" size="sm" className="font-extrabold text-xs h-9 rounded-xl shadow-accent-glow">{t("nav.signup")}</Button>
        </Link>
      </div>
    );
  }

  // ── Authenticated — user menu ──
  const role = (user as { role?: string }).role;
  const displayName = (user as { name?: string }).name || (user as { email?: string }).email || "";
  const avatarUrl = (user as { avatar_url?: string }).avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="hidden md:flex items-center gap-3" ref={menuRef}>
      <NotificationBell />
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold transition-all border",
            menuOpen
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border/50"
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
              {initials}
            </span>
          )}
          <span className="max-w-[100px] truncate">{displayName}</span>
          <ChevronRight className={cn("h-3 w-3 transition-transform", menuOpen && "rotate-90")} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/80 rounded-2xl shadow-xl p-2 z-[110] backdrop-blur-xl">
            {/* User info header */}
            <div className="px-3 py-2 border-b border-border/40 mb-1">
              <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{(user as { email?: string }).email}</p>
            </div>

            {/* Navigation links */}
            <Link href="/my-events" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
              {t("nav.myEvents")}
            </Link>
            <Link href="/settings/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
              {t("nav.notifications")}
            </Link>
            <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
              {t("nav.profile")}
            </Link>

            {/* Role-specific links */}
            {(role === "organizer" || role === "admin") && (
              <Link href="/org/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-accent/10 hover:text-accent transition-colors">
                <LayoutDashboard className="h-3.5 w-3.5" /> Organizer Dashboard
              </Link>
            )}
            {role === "admin" && (
              <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors">
                <Shield className="h-3.5 w-3.5" /> Admin Dashboard
              </Link>
            )}

            {/* Become an organizer CTA — for attendees */}
            {role === "attendee" && (
              <Link href="/org/become" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors mt-1 border border-primary/10">
                <Monitor className="h-3.5 w-3.5" /> {t("nav.becomeOrganizer")}
              </Link>
            )}

            {/* Logout */}
            <div className="border-t border-border/40 mt-1 pt-1">
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
              >
                {t("nav.logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * R6: Auth-aware controls for the mobile drawer bottom section.
 * Same three states as DesktopAuthControls but laid out vertically.
 */
function MobileAuthControls() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { t } = useLocale();

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 pt-6 border-t border-border/40 mt-8">
        <div className="h-11 w-full rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-11 w-full rounded-xl bg-muted/60 animate-pulse" />
      </div>
    );
  }

  // ── Not authenticated ──
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col gap-3 pt-6 border-t border-border/40 mt-8">
        <Link href="/auth/login" className="w-full">
          <Button variant="outline" className="w-full min-h-[44px] rounded-xl font-bold text-sm">
            {t("nav.login")}
          </Button>
        </Link>
        <Link href="/auth/signup" className="w-full">
          <Button variant="accent" className="w-full min-h-[44px] rounded-xl font-extrabold text-sm shadow-accent-glow">
            {t("nav.signup")}
          </Button>
        </Link>
      </div>
    );
  }

  // ── Authenticated — full menu ──
  const role = (user as { role?: string }).role;
  const displayName = (user as { name?: string }).name || (user as { email?: string }).email || "";
  const avatarUrl = (user as { avatar_url?: string }).avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-3 pt-6 border-t border-border/40 mt-8">
      <NotificationBell />
      {/* User info */}
      <div className="flex items-center gap-3 px-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-black">
            {initials}
          </span>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-foreground truncate">{displayName}</span>
          <span className="text-[10px] text-muted-foreground truncate">{(user as { email?: string }).email}</span>
        </div>
      </div>

      {/* Navigation links */}
      <Link href="/my-events" className="min-h-[44px] flex items-center px-4 rounded-xl text-sm font-bold text-foreground hover:bg-muted/50 transition-colors">
        {t("nav.myEvents")}
      </Link>
      <Link href="/settings/notifications" className="min-h-[44px] flex items-center px-4 rounded-xl text-sm font-bold text-foreground hover:bg-muted/50 transition-colors">
        {t("nav.notifications")}
      </Link>
      <Link href="/profile" className="min-h-[44px] flex items-center px-4 rounded-xl text-sm font-bold text-foreground hover:bg-muted/50 transition-colors">
        {t("nav.profile")}
      </Link>

      {/* Role-specific links */}
      {(role === "organizer" || role === "admin") && (
        <Link href="/org/dashboard" className="min-h-[44px] flex items-center gap-3 px-4 rounded-xl text-sm font-bold text-accent hover:bg-accent/10 transition-colors">
          <LayoutDashboard className="h-4 w-4" /> Organizer Dashboard
        </Link>
      )}
      {role === "admin" && (
        <Link href="/admin/dashboard" className="min-h-[44px] flex items-center gap-3 px-4 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors">
          <Shield className="h-4 w-4" /> Admin Dashboard
        </Link>
      )}

      {/* Become an organizer CTA — for attendees */}
      {role === "attendee" && (
        <Link href="/org/become" className="min-h-[44px] flex items-center gap-3 px-4 rounded-xl text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/10">
          <Monitor className="h-4 w-4" /> {t("nav.becomeOrganizer")}
        </Link>
      )}

      {/* Logout */}
      <button
        onClick={logout}
        className="min-h-[44px] flex items-center px-4 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors text-left"
      >
        {t("nav.logout")}
      </button>
    </div>
  );
}

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

          {/* Desktop Central Navigation — wrapped in Suspense because it uses useSearchParams */}
          <React.Suspense fallback={<div className="hidden md:block w-px" />}>
            <DesktopNavLinks pathname={pathname} />
          </React.Suspense>

          {/* Desktop Controls Panel */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <div className="h-4 w-[1px] bg-border/80" />
            <DesktopAuthControls />
          </div>

          {/* Mobile Drawer Trigger with minimum 44px touch region rules */}
          <button
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted border border-border/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setMobileOpen(true)}
            aria-label={t("navbar.openMenu")}
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
                    aria-label={t("navbar.closeMenu")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Primary Nav Stack — wrapped in Suspense because it uses useSearchParams */}
                <React.Suspense fallback={null}>
                  <MobileNavLinks pathname={pathname} />
                </React.Suspense>
              </div>

              {/* Drawer Bottom Actions — auth-aware */}
              <MobileAuthControls />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}