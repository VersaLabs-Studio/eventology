"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/public/hero-section";
import { FeaturedCarousel } from "@/components/public/featured-carousel";
import { CategoryGrid } from "@/components/public/category-grid";
import { EventCard } from "@/components/shared/event-card";
import { RecommendationsRail } from "@/components/ai/recommendations-rail";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Ticket, ArrowRight, Sparkles, Globe2, ShieldCheck, Zap, Infinity as InfinityIcon, Calendar, MapPin } from "lucide-react";
import { getUpcomingEvents } from "@/lib/mock-data";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10">
      <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight inline-block relative">
        {title}
        <span className="absolute -bottom-2 left-0 h-1.5 w-1/3 rounded-full bg-primary" />
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-sm sm:text-base mt-3 max-w-2xl font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function HowItWorksCard({ icon: Icon, title, description, badge }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; badge?: string }) {
  return (
    <div className="relative group bg-card border border-border/60 hover:border-primary/40 rounded-3xl p-8 transition-all duration-300 hover:shadow-xl">
      {badge && (
        <span className="absolute top-6 right-6 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
          {badge}
        </span>
      )}
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-display font-bold text-xl text-foreground mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export function PublicHomePage() {
  const [tab, setTab] = React.useState("all");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const upcoming = getUpcomingEvents();
  const filtered = upcoming.filter((e) => {
    if (tab === "free") return e.ticketType === "free";
    return true;
  });
  const displayEvents = filtered.slice(0, 6);

  return (
    <>
      <HeroSection />

      {/* Brand Architecture & Bloated Text Storytelling Section */}
      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-accent/10 text-accent text-xs font-extrabold uppercase tracking-wider mb-4">
                <InfinityIcon className="h-4 w-4" /> Brand Philosophy
              </div>
              <h2 className="font-display font-black text-3xl sm:text-5xl text-foreground tracking-tight leading-[1.1] mb-6">
                Infinite Possibilities. <br />
                <span className="text-primary">Defined By Time & Space.</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6 font-medium">
                The Eventology identity is forged directly into our official infinite emblem. The central loop represents the <strong>boundless continuum of discovery</strong>—thousands of knowledge-sharing events, corporate galas, and developer meetups awaiting exploration across Ethiopia.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/60">
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-accent shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Temporal Precision</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Absolute schedule routing and digital ICS calendar links.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Spatial Presence</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Nationwide mapping from Addis halls to sub-city open spaces.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* IMAX-Grade Bento Box Visual Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between aspect-square relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                <Globe2 className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-black text-foreground">National Hubs</div>
                  <p className="text-xs text-muted-foreground mt-1">Expanding continuously to 12 regional cities.</p>
                </div>
              </div>
              
              <div className="bg-primary rounded-3xl p-6 shadow-glow flex flex-col justify-between aspect-square text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
                <Zap className="h-8 w-8 text-primary-foreground animate-bounce" />
                <div>
                  <div className="text-2xl font-black">Sub-Second QR</div>
                  <p className="text-xs text-primary-foreground/80 mt-1">Instant local gate scan integration.</p>
                </div>
              </div>

              <div className="col-span-2 bg-card border border-border/80 rounded-3xl p-6 shadow-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-accent/10">
                    <ShieldCheck className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">Enterprise Security Layer</div>
                    <p className="text-xs text-muted-foreground">End-to-end telemetry auditing & telemetry locks.</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded bg-muted text-muted-foreground">Active</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Carousel Stack */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader 
            title="Headline Gatherings" 
            subtitle="Curated premium activations commanding top regional stage presence across Addis Ababa and secondary high-growth hubs."
          />
          <FeaturedCarousel />
          <div className="text-center mt-10">
            <Link href="/events" className="inline-flex items-center gap-2 text-sm font-extrabold text-primary hover:text-accent transition-colors">
              <span>Explore All Featured Events</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Category Matrix */}
      <section className="py-16 sm:py-24 bg-muted/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader 
            title="Browse by Category" 
            subtitle="Filter dynamic multi-tier programming spanning industrial engineering, artistic showcases, and executive roundtables."
          />
          <CategoryGrid />
        </div>
      </section>

      {/* AI Recommendations rail (skips on no-user / AI outage) */}
      <RecommendationsRail />

      {/* Main Upcoming Event Discovery Stream */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeader 
              title="National Live Registry" 
              subtitle="Real-time synchronized schedules across our enterprise fallback array."
            />
            <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto pb-4">
              <TabsList className="grid grid-cols-2 w-full sm:w-60 h-11 p-1 rounded-xl bg-muted/60">
                <TabsTrigger value="all" className="rounded-lg text-xs font-bold">All Access</TabsTrigger>
                <TabsTrigger value="free" className="rounded-lg text-xs font-bold">Free Entry</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 min-h-[400px]">
            {mounted ? (
              displayEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))
            ) : (
              // Initial skeleton rendering state to avoid hydration mismatch
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[380px] w-full rounded-xl bg-card border border-border/40 animate-pulse" />
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/events">
              <Button variant="outline" size="lg" className="min-h-[48px] px-8 rounded-xl font-extrabold text-sm border-border/80 hover:bg-muted/50">
                Load Complete Discovery Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Showcase */}
      <section className="py-16 sm:py-24 bg-muted/20 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader 
            title="Three-Step Frictionless Funnel" 
            subtitle="Designed for maximum checkout velocity and persistent local ticket accessibility."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <HowItWorksCard 
              icon={Search} 
              title="1. Intelligent Indexing" 
              description="Filter our resilient caching grid by temporal targets, sub-city bounds, or free/paid parameters." 
              badge="Fast"
            />
            <HowItWorksCard 
              icon={UserPlus} 
              title="2. Instant Verification" 
              description="Complete transaction streams in under 30 seconds using unified local telephony validation tokens." 
              badge="Secure"
            />
            <HowItWorksCard 
              icon={Ticket} 
              title="3. Offline Entry Assurance" 
              description="Present client-rendered cryptographic QR matrix patterns at the gate. No roaming connectivity required." 
              badge="Reliable"
            />
          </div>
        </div>
      </section>

      {/* High Conversion Storefront Ending CTA */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-primary via-emerald-600 to-accent rounded-3xl p-10 sm:p-16 text-center text-white overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="inline-block text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-white/20 backdrop-blur-md mb-4 tracking-widest">
                Organizer Program
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl leading-tight mb-4">
                Deploy Your Custom Bounded Event Context Today
              </h2>
              <p className="text-white/80 text-base sm:text-lg mb-8 font-medium">
                Tap into advanced telemetry analytics, integrated attendee multi-tier ticket models, and dedicated enterprise application scopes.
              </p>
              <Link href="/auth/signup">
                <Button variant="secondary" size="lg" className="min-h-[52px] px-10 rounded-xl font-black text-sm text-primary hover:bg-white/90 shadow-xl transition-all">
                  Initialize Organizer Container
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

