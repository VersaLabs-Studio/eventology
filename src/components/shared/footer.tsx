import * as React from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <Logo size="default" />
            <p className="mt-4 text-sm text-white/60 max-w-xs leading-relaxed">
              The premium digital event management infrastructure for Ethiopia. Discover, attend, and scale events nationwide.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">Discover</h4>
            <ul className="space-y-3">
              <li><Link href="/events" className="text-sm text-white/60 hover:text-white transition-colors">All Events</Link></li>
              <li><Link href="/events?category=tech" className="text-sm text-white/60 hover:text-white transition-colors">Tech Events</Link></li>
              <li><Link href="/events?category=music" className="text-sm text-white/60 hover:text-white transition-colors">Music Events</Link></li>
              <li><Link href="/events?category=business" className="text-sm text-white/60 hover:text-white transition-colors">Business Events</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">For Organizers</h4>
            <ul className="space-y-3">
              <li><Link href="/org/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/org/events/create" className="text-sm text-white/60 hover:text-white transition-colors">Create Event</Link></li>
              <li><Link href="/org/drafts" className="text-sm text-white/60 hover:text-white transition-colors">My Drafts</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 bg-white/10" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} Eventology. All rights reserved.</p>
          <p className="text-sm text-white/40 font-medium">Architected for Ethiopia 🇪🇹</p>
        </div>
      </div>
    </footer>
  );
}

