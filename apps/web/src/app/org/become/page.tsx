"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Crown, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

/**
 * Become-organizer self-service page.
 *
 * This page lives at /org/become — OUTSIDE the (organizer) route group,
 * so it doesn't inherit the role check in (organizer)/layout.tsx. Any
 * authenticated attendee can reach it. After becoming an organizer, the
 * user is redirected to /org/dashboard (which IS inside the organizer group).
 */
export default function BecomeOrganizerPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleBecome = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/protected/org/become", { method: "POST" });
      const data = await res.json() as { ok?: boolean; error?: { message?: string } };

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to become organizer");
      }

      setSuccess(true);
      toast.success(t("orgBecome.success"));
      setTimeout(() => router.push("/org/dashboard"), 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-border/60 shadow-xl">
          <CardContent className="p-8 text-center">
            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-4"
              >
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                <h1 className="font-display font-bold text-2xl text-foreground">
                  {t("orgBecome.successTitle")}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t("orgBecome.successBody")}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-2xl text-foreground mb-2">
                    {t("orgBecome.title")}
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t("orgBecome.description")}
                  </p>
                </div>
                <div className="space-y-3 text-left">
                  {[
                    t("orgBecome.benefit1"),
                    t("orgBecome.benefit2"),
                    t("orgBecome.benefit3"),
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleBecome}
                  disabled={loading}
                  className="w-full min-h-[48px] rounded-xl font-bold"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <>
                      {t("orgBecome.cta")}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  {t("orgBecome.note")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
