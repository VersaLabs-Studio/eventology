"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrganizerVerificationCard } from "@/components/admin/organizer-verification-card";
import { organizers } from "@/lib/mock-data";
import { toast } from "sonner";

export default function OrganizersPage() {
  const unverified = organizers.filter((o) => !o.verified);
  const verified = organizers.filter((o) => o.verified);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Organizer Verification" description={`${unverified.length} pending verifications`} />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({unverified.length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verified.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected (0)</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unverified.map((org) => (
              <OrganizerVerificationCard
                key={org.id}
                organizer={org}
                onVerify={() => toast.success(`${org.name} verified successfully!`)}
                onReject={() => toast(`Verification rejected for ${org.name}`)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="verified" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verified.map((org) => (
              <OrganizerVerificationCard
                key={org.id}
                organizer={org}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
