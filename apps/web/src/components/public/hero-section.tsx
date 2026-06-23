"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { SearchBar } from "@/components/shared/search-bar";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function HeroSection() {
  const { t } = useLocale();
  return (
    <section className="relative min-h-[45vh] bg-background flex items-center overflow-hidden border-b border-border/60">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs sm:text-sm mb-5 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>{t("hero.badge")}</span>
          </motion.div>

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="relative p-3 rounded-2xl bg-card border border-border/80 shadow-xl backdrop-blur-md"
            >
              <Image
                src="/logo.png"
                alt="Eventology Official Asset"
                width={80}
                height={80}
                className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                priority
              />
              <div className="absolute inset-0 rounded-2xl bg-primary/5 -z-10 animate-pulse" />
            </motion.div>
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-foreground tracking-tight leading-[1.1] mb-4">
            {t("hero.headlineStart")} <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {t("hero.headlineEnd")}
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto mb-8 font-medium leading-relaxed">
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
