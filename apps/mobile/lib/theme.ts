// ============================================================================
// Eventology Mobile — Design Tokens
// ============================================================================
// Brand identity: emerald (#10B981 / #059669) on deep-obsidian.
// Mirrors the web app's OKLCH palette in explicit hex so it works on
// native (no Tailwind). Typography is Plus Jakarta Sans (loaded by
// the platform default; Android falls back to system sans-serif).
// ============================================================================

export const colors = {
  // Brand
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryDeep: '#047857',
  primaryMuted: '#D1FAE5',

  // Accent (used for highlights, hero banners)
  accent: '#F59E0B',
  accentLight: '#FBBF24',

  // Surfaces — light theme
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F5',
  surfaceElevated: '#FFFFFF',

  // Surfaces — dark theme (deep obsidian)
  backgroundDark: '#0A0A0A',
  surfaceDark: '#171717',
  surfaceMutedDark: '#262626',
  surfaceElevatedDark: '#1F1F23',

  // Text
  text: '#0A0A0A',
  textMuted: '#71717A',
  textSubtle: '#A1A1AA',
  textDark: '#FAFAFA',
  textMutedDark: '#A1A1AA',
  textSubtleDark: '#71717A',

  // Borders
  border: '#E4E4E7',
  borderDark: '#27272A',

  // Status
  success: '#22C55E',
  successMuted: '#DCFCE7',
  warning: '#F59E0B',
  warningMuted: '#FEF3C7',
  destructive: '#EF4444',
  destructiveMuted: '#FEE2E2',
  info: '#3B82F6',
  infoMuted: '#DBEAFE',

  // Overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(255,255,255,0.18)',
  glassBorder: 'rgba(255,255,255,0.12)',
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
  display: { fontSize: 28, fontWeight: '800' as const, lineHeight: 34 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
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
} as const;

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
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
  };
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
