'use client';

// ============================================================================
// AddToWallet — Apple / Google wallet buttons (HO-H)
// ============================================================================
// Apple: direct GET → the route streams the pass artifact as an attachment.
// Google: GET returns { url } → fetch then open (the live provider returns a
// signed Google save URL; the stub returns an in-app placeholder URL).
// Pass payloads are never generated on the client — this component only
// triggers the server routes.
// ============================================================================

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WalletPassKeys } from "@eventology/config";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

export function AddToWallet({ ticketId }: { ticketId: string }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [pending, setPending] = React.useState<"apple" | "google" | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: WalletPassKeys.byTicket(ticketId) });
  };

  const addToApple = () => {
    setPending("apple");
    // Direct navigation: the route responds with a downloadable artifact.
    window.location.assign(`/api/protected/tickets/${ticketId}/wallet/apple`);
    // Give the navigation a beat, then clear the spinner + refresh pass state.
    setTimeout(() => {
      setPending(null);
      invalidate();
      toast.success(t("wallet.passIssued"));
    }, 1200);
  };

  const addToGoogle = async () => {
    setPending("google");
    try {
      const res = await fetch(`/api/protected/tickets/${ticketId}/wallet/google`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? t("wallet.passFailed"));
      }
      const { url } = (await res.json()) as { url: string };
      invalidate();
      toast.success(t("wallet.passIssued"));
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("wallet.passFailed"));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl font-bold min-h-[40px]"
        onClick={addToApple}
        disabled={pending !== null}
      >
        {pending === "apple" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <Wallet className="h-4 w-4 mr-1.5" />
        )}
        {t("wallet.addToAppleWallet")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl font-bold min-h-[40px]"
        onClick={addToGoogle}
        disabled={pending !== null}
      >
        {pending === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <Wallet className="h-4 w-4 mr-1.5" />
        )}
        {t("wallet.addToGoogleWallet")}
      </Button>
    </div>
  );
}
