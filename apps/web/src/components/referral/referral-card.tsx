'use client';

// ============================================================================
// ReferralCard — my code, invite link, copy/share, stats (HO-E)
// ============================================================================
// The invite URL points at the landing page (?ref=CODE) where RefCapture
// persists the code; qualification rewards fire server-side on the invitee's
// first confirmed attendance.
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Copy, Gift, Share2, UserCheck, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useMyReferral } from "@/hooks/use-referral";
import { useLocale } from "@/lib/i18n";
export function ReferralCard() {
  const { t } = useLocale();
  const { data, isLoading } = useMyReferral();

  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  if (isLoading || !data) {
    return <Skeleton className="h-56 w-full rounded-2xl" />;
  }

  const copy = async () => {
    await navigator.clipboard?.writeText(data.inviteUrl);
    setCopied(true);
    toast.success(t("referral.linkCopied"));
  };

  const nativeShare = async () => {
    if (typeof navigator.share !== "function") {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: t("referral.shareTitle"),
        text: t("referral.shareText"),
        url: data.inviteUrl,
      });
    } catch {
      // User dismissed the share sheet — not an error.
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {t("referral.title")}
          </CardTitle>
          <CardDescription>{t("referral.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code + link */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              {t("referral.yourCode")}
            </p>
            <p className="font-display text-3xl font-black tracking-[0.3em] text-primary mt-1">
              {data.code}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button variant="outline" size="sm" className="rounded-xl font-bold min-h-[40px]" onClick={copy}>
                {copied ? <Check className="h-4 w-4 mr-1.5 text-success" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? t("referral.copied") : t("referral.copyLink")}
              </Button>
              <Button variant="accent" size="sm" className="rounded-xl font-bold min-h-[40px]" onClick={nativeShare}>
                <Share2 className="h-4 w-4 mr-1.5" />
                {t("referral.share")}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 p-3 text-center">
              <UserPlus className="h-4 w-4 text-muted-foreground mx-auto" />
              <p className="text-xl font-black tabular-nums mt-1">{data.signups}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("referral.signups")}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-3 text-center">
              <UserCheck className="h-4 w-4 text-success mx-auto" />
              <p className="text-xl font-black tabular-nums mt-1">{data.qualified}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("referral.qualified")}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">{t("referral.howItWorks")}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

