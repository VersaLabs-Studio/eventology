"use client";

// ============================================================================
// /discover — Interactive Discovery Hub (HO-J)
// ============================================================================
// Pure composition over existing endpoints (LOCKED — no new tables, no
// aggregator). Each rail is an independent client component with its own
// query: a failing rail omits itself without breaking the page.
//
// Personalized rails gate on session at render time (absent, not empty).
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { WeekendRail } from "@/components/discover/weekend-rail";
import { NearbyMapBrowse } from "@/components/discover/nearby-map-browse";
import { ForYouRail } from "@/components/discover/for-you-rail";
import { FeaturedCollections } from "@/components/discover/featured-collections";
import { TrendingRail } from "@/components/discover/trending-rail";
import { useLocale } from "@/lib/i18n";

export default function DiscoverPage() {
  const { t } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12"
    >
      <PageHeader
        title={t("discover.title")}
        description={t("discover.subtitle")}
      />

      <WeekendRail />
      <TrendingRail />
      <ForYouRail />
      <NearbyMapBrowse />
      <FeaturedCollections />
    </motion.div>
  );
}
