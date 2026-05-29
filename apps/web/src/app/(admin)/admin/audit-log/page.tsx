"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { AuditLogTable } from "@/components/admin/audit-log-table";

export default function AuditLogPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Audit Log" description="Every admin action is recorded" />
      <AuditLogTable />
    </motion.div>
  );
}
