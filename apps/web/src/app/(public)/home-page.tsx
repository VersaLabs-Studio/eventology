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
import { Search, UserPlus, Ticket, ArrowRight, Globe2, ShieldCheck, Zap } from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { useLocale } from "@/lib/i18n";

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

export function PublicHomePage() {
  const { t } = useLocale();
  const [tab, setTab] = React.useState("all");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Real upcoming events from the public API (RLS filters to status='approved').
  const eventsQ = useEvents({ limit: 30, date: 'upcoming', sort: 'date-asc' });
  const upcoming = eventsQ.data?.data ?? [];

  const filtered = upcoming.filter((e) => {
    if (tab === "free") return e.ticketType === "free";
    return true;
  });
  const displayEvents = filtered.slice(0, 12);

  return (
    <>
      <HeroSection />

      {/* Featured Carousel — above the fold */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title={t("home.headlineGatherings")}
            subtitle={t("home.headlineGatheringsSub")}
          />
          <FeaturedCarousel />
          <div className="text-center mt-10">
            <Link href="/events" className="inline-flex items-center gap-2 text-sm font-extrabold text-primary hover:text-accent transition-colors">
              <span>{t("home.exploreAllFeatured")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events stream — raised above categories */}
      <section className="py-16 sm:py-24 bg-muted/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeader
              title={t("home.nationalLiveRegistry")}
              subtitle={t("home.nationalLiveRegistrySub")}
            />
            <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto pb-4">
              <TabsList className="grid grid-cols-2 w-full sm:w-60 h-11 p-1 rounded-xl bg-muted/60">
                <TabsTrigger value="all" className="rounded-lg text-xs font-bold">{t("home.allAccess")}</TabsTrigger>
                <TabsTrigger value="free" className="rounded-lg text-xs font-bold">{t("home.freeEntry")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]">
            {mounted && !eventsQ.isLoading ? (
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
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[380px] w-full rounded-xl bg-card border border-border/40 animate-pulse" />
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/events">
              <Button variant="outline" size="lg" className="min-h-[48px] px-8 rounded-xl font-extrabold text-sm border-border/80 hover:bg-muted/50">
                {t("home.loadCompleteCatalog")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title={t("home.browseByCategory")}
            subtitle={t("home.browseByCategorySub")}
          />
          <CategoryGrid />
        </div>
      </section>

      {/* AI Recommendations rail */}
      <RecommendationsRail />

      {/* Compact metrics/trust strip — replaces the bloated bento */}
      <section className="py-12 sm:py-16 bg-muted/20 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-5"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Globe2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-lg font-black text-foreground">{t("home.nationalHubs")}</div>
                <p className="text-xs text-muted-foreground">{t("home.nationalHubsBody")}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-5"
            >
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="text-lg font-black text-foreground">{t("home.subSecondQR")}</div>
                <p className="text-xs text-muted-foreground">{t("home.subSecondQRBody")}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-5"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-black text-foreground">{t("home.enterpriseSecurity")}</div>
                <p className="text-xs text-muted-foreground">{t("home.enterpriseSecurityBody")}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works — compact row */}
      <section className="py-12 sm:py-16 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title={t("home.threeStepFunnel")}
            subtitle={t("home.threeStepFunnelSub")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Search, title: t("home.step1Title"), desc: t("home.step1Desc") },
              { icon: UserPlus, title: t("home.step2Title"), desc: t("home.step2Desc") },
              { icon: Ticket, title: t("home.step3Title"), desc: t("home.step3Desc") },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-4 bg-card border border-border/60 rounded-2xl p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Organizer CTA — at the bottom, smaller */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-primary via-emerald-600 to-accent rounded-3xl p-8 sm:p-12 text-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-block text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-white/20 backdrop-blur-md mb-3 tracking-widest">
                {t("home.organizerProgram")}
              </span>
              <h2 className="font-display font-black text-2xl sm:text-4xl leading-tight mb-3">
                {t("home.deployToday")}
              </h2>
              <p className="text-white/80 text-sm sm:text-base mb-6 font-medium">
                {t("home.deployBody")}
              </p>
              <Link href="/auth/signup">
                <Button variant="secondary" size="lg" className="min-h-[48px] px-8 rounded-xl font-black text-sm text-primary hover:bg-white/90 shadow-xl transition-all">
                  {t("home.initializeOrg")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
