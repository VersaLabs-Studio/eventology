/**
 * Eventology Mobile — Design Tokens
 * Adapted from web demo's semantic color system.
 * All colors are explicit hex (no Tailwind on native).
 */

export const colors = {
  primary: "#16a34a",
  primaryLight: "#22c55e",
  primaryDark: "#15803d",
  accent: "#0ea5e9",
  accentLight: "#38bdf8",
  background: "#fafafa",
  backgroundDark: "#0a0a0a",
  card: "#ffffff",
  cardDark: "#171717",
  foreground: "#0a0a0a",
  foregroundDark: "#fafafa",
  muted: "#737373",
  mutedLight: "#a3a3a3",
  border: "#e5e5e5",
  borderDark: "#262626",
  destructive: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0,0,0,0.5)",
  // Banner gradient stops
  gradientTopSoft: "rgba(0,0,0,0.10)",
  gradientMidSoft: "rgba(0,0,0,0.30)",
  gradientBaseStrong: "rgba(0,0,0,0.65)",
  // Glassy / floating surfaces
  overlayLight: "rgba(255,255,255,0.18)",
  overlayPressed: "rgba(0,0,0,0.65)",
  // Type
  textShadow: "rgba(0,0,0,0.45)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: "800" as const, lineHeight: 34 },
  h1: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: "700" as const, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  bodyBold: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
  small: { fontSize: 11, fontWeight: "400" as const, lineHeight: 14 },
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
