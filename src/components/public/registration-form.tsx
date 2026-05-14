"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCheck, ArrowRight, PartyPopper } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface RegistrationFormProps {
  eventId: string;
  eventTitle: string;
  ticketTier: string;
}

export function RegistrationForm({ eventId, eventTitle, ticketTier }: RegistrationFormProps) {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email";
    if (!phone.trim()) errs.phone = "Phone is required";
    if (!agreed) errs.agreed = "You must agree to the terms";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSubmitted(true);
    toast.success("Registration successful! Check your email for the ticket.");
  };

  if (isSubmitted) {
    const ticketId = `tkt_${Math.random().toString(36).substring(2, 8)}`;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCheck className="h-8 w-8 text-success" />
        </motion.div>
        <h3 className="font-display font-semibold text-xl">You&apos;re Registered!</h3>
        <p className="text-muted-foreground mt-2">Your spot at {eventTitle} is confirmed.</p>
        <div className="mt-6">
          <Link href={`/ticket/${ticketId}`}>
            <Button variant="accent" size="lg">
              View Your Ticket <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          You&apos;ll receive a confirmation email with your QR code ticket.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+251</span>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="911 123 456" className="pl-12" />
        </div>
        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-sm text-muted-foreground">I agree to the terms and conditions</span>
      </label>
      {errors.agreed && <p className="text-xs text-destructive">{errors.agreed}</p>}
      <Button type="submit" variant="accent" size="lg" className="w-full">
        Complete Registration
      </Button>
    </form>
  );
}
