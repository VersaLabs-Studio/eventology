"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QRCodeProps {
  data: string;
  size?: number;
  className?: string;
}

export function QRCode({ data, size = 160, className }: QRCodeProps) {
  return (
    <Card className={cn("inline-flex", className)}>
      <CardContent className="p-4">
        <QRCodeSVG
          value={data}
          size={size}
          fgColor="#065F46"  /* deep emerald — QR library requires hex */
          bgColor="#FFFFFF"  /* white — QR library requires hex */
          level="M"
        />
      </CardContent>
    </Card>
  );
}
