"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EventForm } from "@/components/dashboard/event-form";

export default function CreateEventPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Create New Event" description="Fill in the details below to create your event" />
      <EventForm />
    </motion.div>
  );
}
