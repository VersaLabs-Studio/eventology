"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/shared/search-bar";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function HeroSection() {
  const { t } = useLocale();
  return (
    <section className="relative min-h-[68vh] flex items-center overflow-hidden bg-background">
      {/* ── Layered ambient background (depth, not flat) ───────────────── */}
      {/* Soft top-down wash so the hero flows out of the navbar (no seam) */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-background to-background pointer-events-none" />
      {/* Primary glow anchored under the navbar */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[820px] h-[420px] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-[130px] rounded-full pointer-events-none" />
      {/* Accent counter-glow bottom-right for asymmetric depth */}
      <div className="absolute bottom-0 right-[6%] w-[420px] h-[260px] bg-gradient-to-tr from-accent/10 to-transparent blur-[120px] rounded-full pointer-events-none" />
      {/* Dot-grid texture (currentColor → robust across token systems) */}
      <div
        className="absolute inset-0 text-foreground/[0.06] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Bottom fade into the page (removes the lower seam) */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs sm:text-sm mb-6 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>{t("hero.badge")}</span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-foreground tracking-tight leading-[1.05] mb-5">
            {t("hero.headlineStart")} <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {t("hero.headlineEnd")}
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-muted-foreground text-base sm:text-xl max-w-2xl mx-auto mb-9 font-medium leading-relaxed">
            {t("hero.subtext")}
          </p>

          {/* Search bar */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-2xl bg-card rounded-2xl p-2 sm:p-3 shadow-2xl border border-border/80 backdrop-blur-xl">
              <SearchBar variant="hero" />
            </div>
          </div>

          {/* Thin inline stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-muted-foreground font-medium">
            <span><strong className="text-foreground font-extrabold">3,500+</strong> {t("hero.statsEvents")}</span>
            <span className="w-px h-4 bg-border/60" />
            <span><strong className="text-foreground font-extrabold">850+</strong> {t("hero.statsPartners")}</span>
            <span className="w-px h-4 bg-border/60" />
            <span><strong className="text-foreground font-extrabold">120K+</strong> {t("hero.statsAttendees")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
