"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  ShieldCheck,
  Star,
  Users,
  BadgeCheck,
  ScrollText,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Variant = "org" | "admin";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const ORG_NAV: NavGroup[] = [
  {
    labelKey: "dashboard.nav.overview",
    items: [{ href: "/org/dashboard", labelKey: "dashboard.nav.overview", icon: LayoutDashboard }],
  },
  {
    labelKey: "dashboard.nav.manage",
    items: [
      { href: "/org/events", labelKey: "dashboard.nav.events", icon: Calendar },
      { href: "/org/drafts", labelKey: "dashboard.nav.drafts", icon: FileText },
      { href: "/org/events/create", labelKey: "dashboard.nav.createEvent", icon: Plus },
    ],
  },
  {
    labelKey: "dashboard.nav.account",
    items: [{ href: "/org/settings", labelKey: "dashboard.nav.settings", icon: Settings }],
  },
];

const ADMIN_NAV: NavGroup[] = [
  {
    labelKey: "dashboard.nav.overview",
    items: [{ href: "/admin/dashboard", labelKey: "dashboard.nav.overview", icon: LayoutDashboard }],
  },
  {
    labelKey: "dashboard.nav.moderation",
    items: [
      { href: "/admin/moderation", labelKey: "dashboard.nav.moderation", icon: ShieldCheck },
      { href: "/admin/organizers", labelKey: "dashboard.nav.organizers", icon: BadgeCheck },
      { href: "/admin/featured", labelKey: "dashboard.nav.featured", icon: Star },
    ],
  },
  {
    labelKey: "dashboard.nav.people",
    items: [{ href: "/admin/users", labelKey: "dashboard.nav.users", icon: Users }],
  },
  {
    labelKey: "dashboard.nav.system",
    items: [{ href: "/admin/audit-log", labelKey: "dashboard.nav.auditLog", icon: ScrollText }],
  },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

interface DashboardSidebarProps {
  variant: Variant;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** When rendered inside the mobile drawer we force expanded + hide the collapse toggle. */
  showCollapseToggle?: boolean;
}

export function DashboardSidebar({
  variant,
  collapsed = false,
  onToggleCollapse,
  showCollapseToggle = true,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user } = useAuth();
  const nav = variant === "org" ? ORG_NAV : ADMIN_NAV;
  const isAdmin = variant === "admin";

  const identityColor = isAdmin ? "text-accent" : "text-primary";
  const identityBg = isAdmin ? "bg-accent/10" : "bg-primary/10";
  const identityBorder = isAdmin ? "border-accent" : "border-primary";

  const displayName =
    (user as { name?: string } | null)?.name ||
    (user as { email?: string } | null)?.email ||
    "";
  const avatarUrl = (user as { avatar_url?: string } | null)?.avatar_url;
  const role = (user as { role?: string } | null)?.role ?? "";

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-full flex flex-col bg-card/80 backdrop-blur-xl border-r border-border/60 transition-all duration-300",
          isAdmin && "border-t-2 border-accent",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-border/60 shrink-0">
          {collapsed ? (
            <Link href={isAdmin ? "/admin/dashboard" : "/org/dashboard"} className="mx-auto">
              <span className={cn("text-xl font-bold", identityColor)}>{isAdmin ? "A" : "E"}</span>
            </Link>
          ) : (
            <Logo size="sm" showText={false} />
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {nav.map((group) => (
            <div key={group.labelKey} className="mb-4">
              {!collapsed && (
                <p className="px-4 mb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
                  {t(group.labelKey)}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        active
                          ? cn(identityBg, identityColor)
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="dash-nav-indicator"
                          className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full",
                            isAdmin ? "bg-accent" : "bg-primary"
                          )}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return link;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: user mini-block */}
        <div className="p-3 border-t border-border/60 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1 py-1">
              <Avatar size="sm">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                <AvatarFallback>{getInitials(displayName || "?")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wide truncate", identityColor)}>
                  {role}
                </p>
              </div>
            </div>
          )}
          {showCollapseToggle && (
            <button
              onClick={onToggleCollapse}
              aria-label={t("dashboard.nav.overview")}
              className="mt-1 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-muted"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
              {!collapsed && <span>{collapsed ? "" : "Collapse"}</span>}
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
