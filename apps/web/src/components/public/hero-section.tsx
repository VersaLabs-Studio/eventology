"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/shared/search-bar";
import { Calendar, Users, Building2, MapPin, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] bg-background flex items-center overflow-hidden border-b border-border/60">
      {/* Dynamic Ambient Background Layers to fix dark-on-dark contrast issue */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      
      {/* Premium Apple Silicon Inspired Floating Spotlight Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Subtle Polka Dot Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.03]"
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`, backgroundSize: "32px 32px" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Animated Top Badge */}
          <motion.div 
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs sm:text-sm mb-6 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>The #1 Event Infrastructure Across Ethiopia</span>
          </motion.div>

          {/* High Fidelity Native Logo Display */}
          <div className="flex justify-center mb-6">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="relative p-3 rounded-2xl bg-card border border-border/80 shadow-xl backdrop-blur-md"
            >
              <img src="/logo.svg" alt="Eventology Official Asset" className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />
              <div className="absolute inset-0 rounded-2xl bg-primary/5 -z-10 animate-pulse" />
            </motion.div>
          </div>

          {/* Epic Main Headline */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-foreground tracking-tight leading-[1.1] mb-6">
            Discover Amazing Events <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Across Ethiopia
            </span>
          </h1>

          {/* Subtext description */}
          <p className="text-muted-foreground text-base sm:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            From premier tech summits in Addis Ababa to sustainable agriculture panels in Hawassa. Register, secure QR passes, and connect instantly.
          </p>

          {/* Search tool block */}
          <div className="flex justify-center mb-12">
            <div className="w-full max-w-2xl bg-card rounded-2xl p-2 sm:p-3 shadow-2xl border border-border/80 backdrop-blur-xl">
              <SearchBar variant="hero" />
            </div>
          </div>

          {/* National Platform Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-border/40 max-w-xl mx-auto">
            <div className="flex flex-col items-center">
              <span className="font-display font-extrabold text-2xl sm:text-4xl text-foreground">3,500+</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Events Hosted</span>
            </div>
            <div className="flex flex-col items-center border-x border-border/40">
              <span className="font-display font-extrabold text-2xl sm:text-4xl text-primary">850+</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Verified Partners</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-display font-extrabold text-2xl sm:text-4xl text-foreground">120K+</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Total Attendees</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Ambient Layout Accent Widgets */}
      <div className="hidden lg:block absolute right-12 top-1/3 -translate-y-1/2">
        <motion.div 
          animate={{ y: [0, -10, 0] }} 
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl p-4 w-60 shadow-2xl rotate-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Live Booking Stream</span>
          </div>
          <div className="h-16 bg-muted rounded-xl mb-2 flex items-center justify-center text-xs font-bold text-muted-foreground">
            🎟️ General Admission · Sold Out
          </div>
          <div className="h-2 bg-muted rounded-full w-3/4 mb-1.5" />
          <div className="h-2 bg-muted rounded-full w-1/2" />
        </motion.div>
      </div>

      <div className="hidden lg:block absolute left-12 bottom-1/3 translate-y-1/2">
        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl p-4 w-52 shadow-2xl -rotate-3"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Active Venues</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-foreground">Millennium Hall</div>
            <div className="text-[10px] text-muted-foreground">Addis Ababa Hub</div>
            <div className="h-1 bg-border rounded-full my-2" />
            <div className="text-xs font-bold text-foreground">Hawassa Ind. Park</div>
            <div className="text-[10px] text-muted-foreground">Southern Regional Hub</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

