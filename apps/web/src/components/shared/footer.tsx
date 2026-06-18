"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/lib/i18n";

export function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Logo size="default" />
            <p className="mt-4 text-sm text-white/60 max-w-xs leading-relaxed">
              {t("footer.aboutText")}
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">{t("footer.discover")}</h4>
            <ul className="space-y-3">
              <li><Link href="/events" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.allEvents")}</Link></li>
              <li><Link href="/events?category=tech" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.techEvents")}</Link></li>
              <li><Link href="/events?category=music" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.musicEvents")}</Link></li>
              <li><Link href="/events?category=business" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.businessEvents")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">{t("footer.forOrganizersColumn")}</h4>
            <ul className="space-y-3">
              <li><Link href="/org/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.dashboard")}</Link></li>
              <li><Link href="/org/events/create" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.createEvent")}</Link></li>
              <li><Link href="/org/drafts" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.myDrafts")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">{t("footer.company")}</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.aboutLink")}</Link></li>
              <li><Link href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.contactLink")}</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.privacyLink")}</Link></li>
              <li><Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">{t("footer.termsLink")}</Link></li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 bg-white/10" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">© {year} {t("common.appName")}. {t("footer.allRightsReserved")}</p>
          <p className="text-sm text-white/40 font-medium">
            {t("footer.architectedBy")}{" "}
            <a href="https://versalabs-studio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-all">
              VersaLabs Studio
            </a>{" "}
            🇪🇹
          </p>
        </div>
      </div>
    </footer>
  );
}

