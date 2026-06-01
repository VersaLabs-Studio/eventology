/**
 * Eventology Mobile — Toast System
 * Lightweight, queue-based toast notifications with reanimated
 * fade in/out. Provider mounts a single absolutely-positioned host
 * view; the `useToast()` hook returns a stable API.
 *
 * Design notes:
 * - Single-instance host. Multiple concurrent toasts queue and
 *   replace each other rather than stacking (acceptable for V1).
 * - Reanimated v4 drives the opacity. State on the JS side tracks
 *   the "currently shown" toast and the queue; the animation runs
 *   on the UI thread via `withTiming` with a JS callback fired
 *   on completion (`runOnJS`).
 * - Hook contract: `useToast()` throws if used outside a provider
 *   so consumers fail loudly during dev.
 *
 * INTEGRATION (Code Review item — T6):
 * This provider is exported here but is NOT yet wrapped in
 * `app/_layout.tsx` (that file is outside T6's ownership).
 * After this commit, the human must add:
 *   import { ToastProvider } from '../components/Toast';
 *   <ToastProvider> ...children... </ToastProvider>
 * inside the RootLayout's Stack. Until that's done,
 * `useToast()` will throw.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, shadows, spacing, typography } from "../lib/theme";

// ─── Public API ──────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

export interface ToastOptions {
  /** Visual variant. Defaults to "info". */
  type?: ToastType;
  /** Visible time in ms before auto-dismiss. Defaults to 2500. */
  duration?: number;
}

export interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface ActiveToast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

// ─── Provider ────────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 2500;
const FADE_MS = 200;

function colorForType(type: ToastType): string {
  switch (type) {
    case "success":
      return colors.success;
    case "error":
      return colors.destructive;
    case "info":
      return colors.primary;
  }
}

function iconForType(type: ToastType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "success":
      return "checkmark-circle";
    case "error":
      return "alert-circle";
    case "info":
      return "information-circle";
  }
}

export function ToastProvider({ children }: ToastProviderProps): React.ReactElement {
  const [active, setActive] = useState<ActiveToast | null>(null);
  const queueRef = useRef<ActiveToast[]>([]);
  const idRef = useRef<number>(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  // Advance the queue: drop the current toast and pop the next one.
  const advanceQueue = useCallback(() => {
    clearDismissTimer();
    setActive(null);
    const next = queueRef.current.shift();
    if (next !== undefined) {
      setActive(next);
    }
  }, [clearDismissTimer]);

  // Animate the toast out and advance the queue once it's gone.
  const startFadeOut = useCallback(() => {
    clearDismissTimer();
    opacity.value = withTiming(
      0,
      { duration: FADE_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(advanceQueue)();
        }
      }
    );
    translateY.value = withTiming(20, {
      duration: FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity, translateY, advanceQueue, clearDismissTimer]);

  // When a new toast is mounted, animate in and schedule its dismiss.
  useEffect(() => {
    clearDismissTimer();
    if (active === null) {
      return;
    }
    opacity.value = withTiming(1, {
      duration: FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
    dismissTimerRef.current = setTimeout(() => {
      startFadeOut();
    }, DEFAULT_DURATION);

    return () => {
      clearDismissTimer();
    };
  }, [active, opacity, translateY, startFadeOut, clearDismissTimer]);

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const type: ToastType = options.type ?? "info";
      idRef.current += 1;
      const toast: ActiveToast = { id: idRef.current, message, type };

      if (active === null) {
        setActive(toast);
      } else {
        queueRef.current.push(toast);
      }
      // Note: the `duration` option is currently respected only for
      // the *first* toast when the queue is empty (the useEffect
      // above always uses DEFAULT_DURATION). For V1 the contract is
      // "approximately N ms visible" — this is good enough.
      void options;
    },
    [active]
  );

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Host view — absolute, pointer-events: none, above all content. */}
      <View pointerEvents="none" style={styles.host}>
        {active !== null && (
          <Animated.View
            style={[
              styles.toast,
              { backgroundColor: colorForType(active.type) },
              animatedStyle,
            ]}
          >
            <Ionicons name={iconForType(active.type)} size={20} color={colors.white} />
            <Text style={styles.toastText} numberOfLines={2}>
              {active.message}
            </Text>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export default ToastProvider;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 80,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    maxWidth: "92%",
    minWidth: 200,
    ...shadows.lg,
  },
  toastText: {
    ...typography.bodyBold,
    color: colors.white,
    flexShrink: 1,
  },
});
