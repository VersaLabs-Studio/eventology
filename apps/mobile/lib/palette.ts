// ============================================================================
// usePalette — the active theme, resolved once per component
// ============================================================================
// Every screen used to open with six lines of
// `const text = isDark ? colors.textDark : colors.text`. This collapses that
// into one hook so a screen names colours semantically (`p.text`) and the
// light/dark branch lives in exactly one place.
// ============================================================================

import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type ThemeColors } from '@/lib/theme';

export interface Palette extends ThemeColors {
  isDark: boolean;
  /** Scrim-safe foreground for text drawn on top of a photo. */
  onImage: string;
  onImageMuted: string;
}

export function usePalette(): Palette {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  return {
    ...theme.colors,
    isDark,
    onImage: '#FFFFFF',
    onImageMuted: 'rgba(255,255,255,0.78)',
  };
}
