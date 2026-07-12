"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, LayoutDashboard, Shield, User, Settings, Bell, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/comms/notification-bell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Variant = "org" | "admin";

const SEGMENT_LABELS: Record<string, string> = {
  org: "dashboard.crumb.org",
  admin: "dashboard.crumb.admin",
  dashboard: "dashboard.crumb.dashboard",
  events: "dashboard.crumb.events",
  drafts: "dashboard.crumb.drafts",
  create: "dashboard.crumb.create",
  registrations: "dashboard.crumb.registrations",
  analytics: "dashboard.crumb.analytics",
  "check-in": "dashboard.crumb.checkIn",
  settings: "dashboard.crumb.settings",
  moderation: "dashboard.crumb.moderation",
  organizers: "dashboard.crumb.organizers",
  featured: "dashboard.crumb.featured",
  users: "dashboard.crumb.users",
  "audit-log": "dashboard.crumb.auditLog",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

function useBreadcrumbs(): string[] {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: string[] = [];
  for (const seg of segments) {
    if (UUID_RE.test(seg)) continue; // skip id segments — page shows the title
    const key = SEGMENT_LABELS[seg];
    if (key) crumbs.push(key);
    else crumbs.push(seg.charAt(0).toUpperCase() + seg.slice(1));
  }
  return crumbs;
}

function TopbarUserMenu({ variant }: { variant: Variant }) {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const displayName =
    (user as { name?: string } | null)?.name ||
    (user as { email?: string } | null)?.email ||
    "";
  const avatarUrl = (user as { avatar_url?: string } | null)?.avatar_url;
  const email = (user as { email?: string } | null)?.email ?? "";
  const role = (user as { role?: string } | null)?.role ?? "";
  const identityColor = variant === "admin" ? "text-accent" : "text-primary";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 h-9 px-2.5 rounded-xl text-xs font-bold transition-all border",
          open
            ? cn(identityColor, "bg-primary/10 border-primary/30")
            : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border/50"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar size="sm">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback>{getInitials(displayName || "?")}</AvatarFallback>
        </Avatar>
        <span className="max-w-[100px] truncate hidden sm:block">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/80 rounded-2xl shadow-xl p-2 z-[120] backdrop-blur-xl">
          <div className="px-3 py-2 border-b border-border/40 mb-1">
            <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <User className="h-3.5 w-3.5" /> {t("dashboard.userMenu.profile")}
          </Link>
          <Link
            href={variant === "admin" ? "/settings/notifications" : "/org/settings"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Settings className="h-3.5 w-3.5" /> {t("dashboard.userMenu.settings")}
          </Link>
          <Link
            href="/settings/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Bell className="h-3.5 w-3.5" /> {t("dashboard.userMenu.notifications")}
          </Link>

          <div className="border-t border-border/40 mt-1 pt-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-muted transition-colors"
            >
              <Home className="h-3.5 w-3.5" /> {t("dashboard.userMenu.backToSite")}
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
            >
              <LogOut className="h-3.5 w-3.5" /> {t("dashboard.userMenu.signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DashboardTopbarProps {
  variant: Variant;
  onMenuClick: () => void;
}

export function DashboardTopbar({ variant, onMenuClick }: DashboardTopbarProps) {
  const { t } = useLocale();
  const crumbs = useBreadcrumbs();
  const isAdmin = variant === "admin";

  return (
    <header className="relative z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border/60 flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Hairline brand gradient under the topbar */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-70",
          isAdmin
            ? "bg-gradient-to-r from-transparent via-accent/50 to-transparent"
            : "bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        )}
      />
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label={t("navbar.openMenu")}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted border border-border/40 transition-colors"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        <nav className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden" aria-label="Breadcrumb">
          {crumbs.map((key, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />}
                <span
                  className={cn(
                    "truncate",
                    isLast ? "font-bold text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t(key)}
                </span>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <LanguageSwitcher />
        <NotificationBell />
        <TopbarUserMenu variant={variant} />
      </div>
    </header>
  );
}
