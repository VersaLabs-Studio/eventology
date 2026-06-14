"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Scan, AlertOctagon, Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";
import { useCheckIn } from "@/hooks/use-tickets";

/** Minimal ApiClientError shape we use in the catch path. */
interface ApiErrorLike extends Error {
  code?: string;
}

interface CheckInScannerProps {
  totalAttendees: number;
  checkedInCount: number;
  eventId: string;
}

interface ScanResult {
  status: 'success' | 'duplicate' | 'invalid';
  message: string;
  ticketNumber?: string;
  at: number;
}

const SCAN_COOLDOWN_MS = 1500;

/**
 * Check-in scanner for organizer use at the gate.
 * Uses the native BarcodeDetector API where available (Chrome/Edge/Safari);
 * falls back to a manual entry box. HMAC verification + ticket state live
 * on the server (POST /api/protected/check-in) — this component only
 * captures the QR payload and surfaces the server result.
 */
export function CheckInScanner({ totalAttendees, checkedInCount, eventId }: CheckInScannerProps) {
  const checkIn = useCheckIn();
  const [manual, setManual] = React.useState('');
  const [scannerActive, setScannerActive] = React.useState(false);
  const [scannerSupported, setScannerSupported] = React.useState<boolean | null>(null);
  const [recent, setRecent] = React.useState<ScanResult[]>([]);
  const lastScanRef = React.useRef<{ value: string; at: number }>({ value: '', at: 0 });
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectorRef = React.useRef<unknown>(null);
  const animFrameRef = React.useRef<number | null>(null);

  const percentage = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;

  // Detect BarcodeDetector support
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      setScannerSupported(true);
    } else {
      setScannerSupported(false);
    }
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = React.useCallback(() => {
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  }, []);

  const performCheckIn = React.useCallback(
    async (qrData: string) => {
      const now = Date.now();
      // Cooldown: ignore repeats of the same QR within 1.5s
      if (lastScanRef.current.value === qrData && now - lastScanRef.current.at < SCAN_COOLDOWN_MS) {
        return;
      }
      lastScanRef.current = { value: qrData, at: now };

      try {
        const result = await checkIn.mutateAsync({ qr_data: qrData });
        const r: ScanResult = {
          status: 'success',
          message: `${result.ticket.ticket_number} · ${result.ticket.tier_name}`,
          ticketNumber: result.ticket.ticket_number,
          at: now,
        };
        setRecent((prev) => [r, ...prev].slice(0, 8));
        toast.success(`Checked in: ${result.ticket.ticket_number}`);
      } catch (err) {
        const e = err as ApiErrorLike;
        const code = e.code ?? '';
        const message = e.message ?? 'Check-in failed';
        const status: ScanResult['status'] =
          code === 'ALREADY_CHECKED_IN' ? 'duplicate' : 'invalid';
        const r: ScanResult = { status, message, at: now };
        setRecent((prev) => [r, ...prev].slice(0, 8));
        if (status === 'duplicate') {
          toast.warning(message);
        } else {
          toast.error(message);
        }
      }
    },
    [checkIn]
  );

  // Start the camera + BarcodeDetector loop
  const startScanner = React.useCallback(async () => {
    if (!scannerSupported) return;
    try {
      // Use the typed BarcodeDetector via `unknown` (DOM lib not always typed)
      const Detector = (window as unknown as { BarcodeDetector: new (init: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      const detector = new Detector({ formats: ['qr_code'] });
      detectorRef.current = detector;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScannerActive(true);

      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0) {
            await performCheckIn(codes[0].rawValue);
          }
        } catch {
          // detect() may throw on transient frames — ignore
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn('[scanner] failed to start camera:', err);
      toast.error('Camera unavailable — use manual entry below.');
      setScannerActive(false);
    }
  }, [scannerSupported, performCheckIn]);

  const handleManual = () => {
    const value = manual.trim();
    if (!value) return;
    performCheckIn(value);
    setManual('');
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          {checkedInCount} of {totalAttendees} attendees checked in
        </p>
        <Progress value={percentage} className="h-3" />
        <p className="text-right text-xs text-muted-foreground mt-1">{percentage}%</p>
      </div>

      {scannerSupported === null ? (
        <div className="h-64 bg-muted/40 rounded-xl animate-pulse" />
      ) : scannerSupported && scannerActive ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-foreground">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
          />
          <motion.div
            className="absolute left-8 right-8 h-0.5 bg-accent"
            animate={{ top: ['20%', '80%', '20%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-3 right-3 z-10"
            onClick={stopScanner}
          >
            <CameraOff className="mr-1 h-3.5 w-3.5" /> Stop
          </Button>
        </div>
      ) : (
        <div className="relative bg-foreground rounded-xl h-64 flex items-center justify-center overflow-hidden">
          <div className="text-center text-background">
            <Scan className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Camera viewport</p>
            <p className="text-sm opacity-60">Use the camera button to start scanning</p>
          </div>
          {scannerSupported && (
            <Button
              size="sm"
              className="absolute top-3 right-3 z-10"
              onClick={startScanner}
            >
              <Camera className="mr-1 h-3.5 w-3.5" /> Start camera
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder={scannerSupported === false ? 'Enter ticket code manually' : 'Or paste a ticket code'}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleManual()}
        />
        <Button onClick={handleManual} disabled={!manual.trim() || checkIn.isPending}>
          {checkIn.isPending ? 'Checking…' : 'Check in'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3">Recent activity</h4>
          <AnimatePresence>
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No scans yet. Scanned tickets will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {recent.map((r, idx) => (
                  <motion.div
                    key={`${r.at}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {r.status === 'success' && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                      {r.status === 'duplicate' && <AlertOctagon className="h-4 w-4 text-warning shrink-0" />}
                      {r.status === 'invalid' && <AlertOctagon className="h-4 w-4 text-destructive shrink-0" />}
                      <span className="truncate">{r.message}</span>
                      <Badge
                        variant={r.status === 'success' ? 'success' : r.status === 'duplicate' ? 'warning' : 'destructive'}
                        className="ml-1"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(r.at).toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
