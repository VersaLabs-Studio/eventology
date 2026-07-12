// ============================================================================
// Eventology Mobile — Design Tokens
// ============================================================================
// Brand identity: emerald (#10B981) over deep obsidian, warm orange accent.
//
// These hexes are the literal resolution of the OKLCH custom properties in
// apps/web/src/app/globals.css — native has no OKLCH and no Tailwind, so the
// values are duplicated here rather than derived. When a brand token changes
// on the web, change it here too; the comment next to each value names the
// web token it mirrors.
//
// Typography is Plus Jakarta Sans on web; Android falls back to system
// sans-serif, so weights carry the brand rather than the face.
// ============================================================================

export const colors = {
  // Brand — --color-primary / --color-secondary / --color-accent
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryDeep: '#047857',
  primaryMuted: '#D1FAE5',

  secondary: '#065F46',
  secondaryLight: '#0F766E',

  // Accent is warm orange on web, NOT amber. Matching it matters: the
  // "Featured" pill and map pins read as a different brand otherwise.
  accent: '#F97316',
  accentLight: '#FB923C',
  accentMuted: '#FFEDD5',
  accentMutedDark: '#7C2D12',

  // Surfaces — light (--color-background / --color-card / --color-muted)
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#E5E5EA',
  surfaceElevated: '#FFFFFF',

  // Surfaces — dark (deep obsidian)
  backgroundDark: '#090A0F',
  surfaceDark: '#12131A',
  surfaceMutedDark: '#1E202B',
  surfaceElevatedDark: '#171923',

  // Text — --color-foreground / --color-muted-foreground
  text: '#1D1D1F',
  textMuted: '#86868B',
  textSubtle: '#A1A1A6',
  textDark: '#F5F5F7',
  textMutedDark: '#8E92A4',
  textSubtleDark: '#6B6F7E',

  // Borders — --color-border
  border: '#D2D2D7',
  borderDark: '#2B2D38',

  // Status
  success: '#34C759',
  successMuted: '#DCFCE7',
  warning: '#FF9500',
  warningMuted: '#FFF4E5',
  destructive: '#FF3B30',
  destructiveMuted: '#FFE5E3',
  info: '#3B82F6',
  infoMuted: '#DBEAFE',

  // Overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(255,255,255,0.18)',
  glassBorder: 'rgba(255,255,255,0.12)',
  white: '#FFFFFF',
} as const;

/**
 * Gradient stop tuples, consumed by <Gradient/>. Kept here so a screen never
 * hand-rolls brand colours inline.
 */
export const gradients = {
  /** Brand wash — deep emerald into vibrant emerald. Auth hero, logo mark. */
  brand: ['#047857', '#10B981'] as const,
  /** Warm counterpart, used sparingly for accent surfaces. */
  ember: ['#C2410C', '#F97316'] as const,
  /** Bottom-up scrim so white text stays legible over any photo. */
  scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)'] as const,
  /** Softer scrim for smaller cards where the title sits lower. */
  scrimSoft: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)'] as const,
  /** Placeholder body when an image is missing entirely. */
  placeholder: ['#065F46', '#10B981', '#34D399'] as const,
  placeholderDark: ['#04231A', '#065F46', '#0F766E'] as const,
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
  display: { fontSize: 30, fontWeight: '800' as const, lineHeight: 36, letterSpacing: -0.6 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  small: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  /** Emerald ambient glow — mirrors the web's --shadow-glow. */
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

export type ThemeMode = 'light' | 'dark';

/**
 * Named on purpose: `interface Palette extends Theme['colors']` does not carry
 * the members across (an indexed access type is not a statically known base),
 * so consumers extend this instead.
 */
export interface ThemeColors {
  primary: string;
  primaryText: string;
  accent: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  destructive: string;
  destructiveMuted: string;
  info: string;
  infoMuted: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: colors.primary,
    primaryText: '#FFFFFF',
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    surfaceMuted: colors.surfaceMuted,
    surfaceElevated: colors.surfaceElevated,
    text: colors.text,
    textMuted: colors.textMuted,
    textSubtle: colors.textSubtle,
    border: colors.border,
    success: colors.success,
    successMuted: colors.successMuted,
    warning: colors.warning,
    warningMuted: colors.warningMuted,
    destructive: colors.destructive,
    destructiveMuted: colors.destructiveMuted,
    info: colors.info,
    infoMuted: colors.infoMuted,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: colors.primaryLight,
    primaryText: '#0A0A0A',
    accent: colors.accentLight,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    surfaceMuted: colors.surfaceMutedDark,
    surfaceElevated: colors.surfaceElevatedDark,
    text: colors.textDark,
    textMuted: colors.textMutedDark,
    textSubtle: colors.textSubtleDark,
    border: colors.borderDark,
    success: colors.success,
    successMuted: '#14532D',
    warning: colors.warning,
    warningMuted: '#78350F',
    destructive: colors.destructive,
    destructiveMuted: '#7F1D1D',
    info: colors.info,
    infoMuted: '#1E3A8A',
  },
};

/**
 * Resolve the active palette from RN's `useColorScheme()` value. Screens
 * previously repeated `isDark ? colors.textDark : colors.text` on every
 * line; prefer `usePalette()` from '@/lib/palette' instead.
 */
export function themeFor(scheme: 'light' | 'dark' | null | undefined): Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
