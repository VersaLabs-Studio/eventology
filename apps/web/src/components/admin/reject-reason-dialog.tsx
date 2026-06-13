"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertOctagon } from "lucide-react";

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

/**
 * Premium-UI replacement for window.prompt() on admin reject flows.
 * R1 audit debt: standardize the reject-reason UX across admin organizer
 * and event pages. The caller wires this to the mutation that needs a
 * reason; we never block on a synchronous prompt again.
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder = "Tell the organizer why you're rejecting this…",
  defaultValue = "",
  confirmLabel = "Reject",
  onConfirm,
  isPending,
}: RejectReasonDialogProps) {
  const [reason, setReason] = React.useState(defaultValue);

  React.useEffect(() => {
    if (open) setReason(defaultValue);
  }, [open, defaultValue]);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertOctagon className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason (required)</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            maxLength={500}
            rows={4}
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {trimmed.length}/500
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canSubmit}
            onClick={() => onConfirm(trimmed)}
          >
            {isPending ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
