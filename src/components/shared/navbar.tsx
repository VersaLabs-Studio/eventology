"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, Monitor, LayoutDashboard, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/events", label: "Discover" },
  { href: "/events", label: "Categories" },
  { href: "/search", label: "Search" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href
                    ? "text-primary font-semibold border-b-2 border-accent"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative group">
              <button className="h-9 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5 border border-border">
                <Monitor className="h-3.5 w-3.5" /> View as
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                  <Monitor className="h-4 w-4" /> Attendee
                </Link>
                <Link href="/org/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                  <LayoutDashboard className="h-4 w-4" /> Organizer
                </Link>
                <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              </div>
            </div>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="accent" size="sm">Sign Up</Button>
            </Link>
          </div>

          <button
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden">
          <div className="flex flex-col items-center justify-center gap-8 h-full">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-xl font-medium",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">View as</span>
              <Link href="/" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-muted-foreground hover:text-foreground">Attendee</Link>
              <Link href="/org/dashboard" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-muted-foreground hover:text-foreground">Organizer</Link>
              <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-muted-foreground hover:text-foreground">Admin</Link>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="lg" className="w-48">Log In</Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                <Button variant="accent" size="lg" className="w-48">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
