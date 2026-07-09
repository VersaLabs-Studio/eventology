"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Crown, ArrowRight, Loader2, CheckCircle2, Clock, ShieldCheck, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

type OrgStatus = "pending" | "verified" | "rejected" | null;

/**
 * Become-organizer self-service page.
 *
 * Lives at /org/become — OUTSIDE the (organizer) route group, so it doesn't
 * inherit the role check in (organizer)/layout.tsx. Any authenticated
 * attendee can reach it. The role is granted ONLY on admin verification
 * (see setUserRole in lib/auth/server.ts); this page just creates a PENDING
 * application and reflects the current status.
 */
export default function BecomeOrganizerPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<OrgStatus>(null);
  const [statusLoaded, setStatusLoaded] = React.useState(false);
  const [reason, setReason] = React.useState<string | null>(null);

  // On load, fetch the caller's current organizer application status.
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/protected/org/become");
        if (!res.ok) return;
        const data = (await res.json()) as { status: OrgStatus; reason?: string | null };
        if (!mounted) return;
        setStatus(data.status ?? null);
        setReason(data.reason ?? null);
      } catch {
        // Non-fatal — fall back to the default CTA state.
      } finally {
        if (mounted) setStatusLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleBecome = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/protected/org/become", { method: "POST" });
      const data = await res.json() as { ok?: boolean; status?: OrgStatus; error?: { message?: string } };

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to become organizer");
      }

      // Switch to the pending state — no redirect. The user waits for admin
      // verification, after which they'll be notified and can reach /org/*.
      setStatus(data.status ?? "pending");
      toast.success(t("orgBecome.success"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isVerified = status === "verified";
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-border/60 shadow-xl overflow-hidden">
          {/* ── Verified state ── */}
          {isVerified && (
            <CardContent className="p-10 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-5"
              >
                <ShieldCheck className="h-16 w-16 text-emerald-500 mx-auto" />
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                  {t("orgBecome.statusVerifiedTitle")}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  {t("orgBecome.statusVerifiedBody")}
                </p>
                <Button
                  onClick={() => router.push("/org/dashboard")}
                  className="w-full min-h-[52px] rounded-xl font-bold text-base"
                  size="lg"
                >
                  {t("orgBecome.goToDashboard")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            </CardContent>
          )}

          {/* ── Pending state ── */}
          {isPending && (
            <CardContent className="p-10 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-5"
              >
                <Clock className="h-16 w-16 text-amber-500 mx-auto" />
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                  {t("orgBecome.statusPendingTitle")}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  {t("orgBecome.statusPendingBody")}
                </p>
              </motion.div>
            </CardContent>
          )}

          {/* ── Rejected state ── */}
          {isRejected && (
            <CardContent className="p-10 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-5"
              >
                <XCircle className="h-16 w-16 text-destructive mx-auto" />
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                  {t("orgBecome.statusRejectedTitle")}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  {t("orgBecome.statusRejectedBody")}
                </p>
                {reason && (
                  <p className="text-sm text-foreground/80 max-w-md mx-auto leading-relaxed bg-muted/40 rounded-xl p-3">
                    {t("orgBecome.statusRejectedReason", { reason })}
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full min-h-[52px] rounded-xl font-bold text-base"
                  size="lg"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {t("orgBecome.statusRejectedCta")}
                </Button>
              </motion.div>
            </CardContent>
          )}

          {/* ── Default CTA state (no application yet) ── */}
          {status === null && (
            <>
              {/* Header band */}
              <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background px-8 sm:px-10 pt-10 pb-8 text-center border-b border-border/50">
                <div className="h-16 w-16 rounded-2xl bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-3 tracking-tight">
                  {t("orgBecome.title")}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                  {t("orgBecome.description")}
                </p>
              </div>

              <CardContent className="p-8 sm:p-10 space-y-8">
                <div className="space-y-3">
                  {[
                    t("orgBecome.benefit1"),
                    t("orgBecome.benefit2"),
                    t("orgBecome.benefit3"),
                  ].map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 rounded-xl border border-border/50 bg-muted/30 p-4"
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed pt-1.5">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleBecome}
                    disabled={loading || !statusLoaded}
                    className="w-full min-h-[52px] rounded-xl font-bold text-base"
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
                  <p className="text-xs text-muted-foreground text-center">
                    {t("orgBecome.note")}
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
