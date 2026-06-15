"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, ShieldCheck, Star, Users, BadgeCheck, ScrollText, ChevronLeft } from "lucide-react";

// R3 / A1: "Revenue" link removed while payments are disabled. The
// destination page is kept as a "Payments coming soon" placeholder so
// any deep links (audit log entries, etc.) survive the flag flip.
const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/admin/featured", label: "Featured", icon: Star },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/organizers", label: "Organizers", icon: BadgeCheck },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "bg-card border-r border-border h-screen flex flex-col transition-all duration-300 border-t-2 border-accent",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-border">
        {collapsed ? (
          <span className="text-xl font-bold text-accent mx-auto">A</span>
        ) : (
          <Link href="/admin/dashboard" className="font-display font-bold text-xl text-accent">Admin</Link>
        )}
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-accent/10 text-accent border-r-2 border-accent"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
