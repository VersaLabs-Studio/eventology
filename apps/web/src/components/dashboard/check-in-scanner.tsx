"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Scan } from "lucide-react";
import { toast } from "sonner";

interface CheckInScannerProps {
  totalAttendees?: number;
  checkedInCount?: number;
}

export function CheckInScanner({ totalAttendees = 150, checkedInCount = 87 }: CheckInScannerProps) {
  const [manualCode, setManualCode] = React.useState("");
  const [recentCheckIns, setRecentCheckIns] = React.useState<{ name: string; time: string }[]>([
    { name: "Abebe Kebede", time: "2 minutes ago" },
    { name: "Tigist Wondimu", time: "5 minutes ago" },
    { name: "Meron Assefa", time: "8 minutes ago" },
  ]);

  const handleManualCheckIn = () => {
    if (!manualCode.trim()) return;
    setRecentCheckIns([{ name: manualCode, time: "Just now" }, ...recentCheckIns]);
    toast.success(`${manualCode} checked in successfully!`);
    setManualCode("");
  };

  const percentage = Math.round((checkedInCount / totalAttendees) * 100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          {checkedInCount} of {totalAttendees} attendees checked in
        </p>
        <Progress value={percentage} className="h-3" />
        <p className="text-right text-xs text-muted-foreground mt-1">{percentage}%</p>
      </div>

      <div className="relative bg-foreground rounded-xl h-64 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)" }} />
        <div className="text-center text-background">
          <Scan className="h-16 w-16 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Camera Viewport</p>
          <p className="text-sm opacity-60">Position QR code within frame</p>
        </div>
        <motion.div
          className="absolute left-10 right-10 h-0.5 bg-accent"
          animate={{ top: ["30%", "70%", "30%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="flex gap-3">
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Enter ticket code manually"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleManualCheckIn()}
        />
        <Button onClick={handleManualCheckIn}>Check In</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3">Recent Check-Ins</h4>
          <div className="space-y-2">
            {recentCheckIns.map((check, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between text-sm py-1"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>{check.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{check.time}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
