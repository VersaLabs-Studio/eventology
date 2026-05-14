"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { FeaturedEventManager } from "@/components/admin/featured-event-manager";

export default function FeaturedPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Featured Events"
        description="Manage homepage featured events"
      />
      <FeaturedEventManager />
    </motion.div>
  );
}
