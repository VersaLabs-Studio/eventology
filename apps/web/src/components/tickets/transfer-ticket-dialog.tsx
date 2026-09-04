'use client';

// ============================================================================
// TransferTicketDialog — transfer by email or release to waitlist (HO-G)
// ============================================================================
// The rotated QR is produced server-side (route pre-signs via the HMAC util);
// this dialog only collects intent. Disabled once the event has started —
// the server enforces the same rule regardless.
// ============================================================================

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, Loader2, Send, Users } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTransferTicket } from "@/hooks/use-ticket-transfers";
import { useLocale } from "@/lib/i18n";

interface TransferTicketDialogProps {
  ticketId: string;
  eventStartDate: string | null;
  open: boolean;
  onClose: () => void;
}

export function TransferTicketDialog({
  ticketId,
  eventStartDate,
  open,
  onClose,
}: TransferTicketDialogProps) {
  const { t } = useLocale();
  const { mutate: transfer, isPending } = useTransferTicket(ticketId);

  const [email, setEmail] = React.useState("");

  const eventStarted = eventStartDate ? new Date(eventStartDate) <= new Date() : false;

  const submitTransfer = () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(t("transfer.invalidEmail"));
      return;
    }
    transfer(
      { to_email: trimmed, kind: "transfer" },
      {
        onSuccess: () => {
          toast.success(t("transfer.transferred"));
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const releaseToWaitlist = () => {
    transfer(
      { kind: "resale" },
      {
        onSuccess: () => {
          toast.success(t("transfer.releasedToWaitlist"));
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-card border-border/60 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div>
            <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              {t("transfer.title")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{t("transfer.description")}</p>
          </div>

          {eventStarted ? (
            <p className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground text-center">
              {t("transfer.eventStarted")}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="transfer-email">
                  {t("transfer.recipientEmail")}
                </label>
                <Input
                  id="transfer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="them@email.com"
                  className="h-11 rounded-xl"
                  disabled={isPending}
                />
                <Button
                  className="w-full min-h-[44px] rounded-xl font-bold"
                  onClick={submitTransfer}
                  disabled={isPending || email.trim().length === 0}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {t("transfer.send")}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("transfer.or")}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full min-h-[44px] rounded-xl font-bold"
                onClick={releaseToWaitlist}
                disabled={isPending}
              >
                <Users className="h-4 w-4 mr-2" />
                {t("transfer.releaseToWaitlist")}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                {t("transfer.qrNote")}
              </p>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
