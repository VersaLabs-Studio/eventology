// ============================================================================
// Typeface — Plus Jakarta Sans (matches the web app)
// ============================================================================
// The web app (apps/web) renders in Plus Jakarta Sans (display + body) with
// JetBrains Mono for numerals. React Native can't synthesise weights from a
// single family the way a browser does: each weight is a *separate* font
// family once loaded at runtime (`PlusJakartaSans_700Bold`, etc.), so a plain
// `fontWeight: '700'` would be ignored and fall back to the system face.
//
// Rather than rewrite every `fontWeight` across ~20 screens, we patch RN's
// <Text>/<TextInput> render once: any element whose style carries a
// `fontWeight` (or none) is given the matching Jakarta family, and the numeric
// weight is neutralised so Android doesn't faux-bold on top of an already-bold
// face. Components that set an explicit `fontFamily` (e.g. mono numerals) are
// left untouched.
//
// Runtime-loaded via `expo-font` — asset only, no native module, so it works
// in Expo Go without an EAS rebuild.
// ============================================================================

import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import type { TextStyle } from 'react-native';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

/** Font map handed to `useFonts()` in the root layout. */
export const fontAssets = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} as const;

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': 'PlusJakartaSans_400Regular',
  '200': 'PlusJakartaSans_400Regular',
  '300': 'PlusJakartaSans_400Regular',
  '400': 'PlusJakartaSans_400Regular',
  normal: 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  bold: 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
  '900': 'PlusJakartaSans_800ExtraBold',
};

/** Resolve a Jakarta family name for a given RN fontWeight. */
export function jakarta(weight?: TextStyle['fontWeight']): string {
  return WEIGHT_TO_FAMILY[String(weight ?? '400')] ?? 'PlusJakartaSans_400Regular';
}

/** JetBrains Mono family for numerals/monospace, matching the web's --font-mono. */
export function mono(weight?: TextStyle['fontWeight']): string {
  const w = String(weight ?? '400');
  if (w === '700' || w === '800' || w === '900' || w === 'bold') return 'JetBrainsMono_700Bold';
  if (w === '500' || w === '600') return 'JetBrainsMono_500Medium';
  return 'JetBrainsMono_400Regular';
}

function withFamily(style: unknown): unknown {
  const flat = (StyleSheet.flatten(style as never) ?? {}) as TextStyle;
  // Respect an explicit family (e.g. a mono numeral) — don't override it.
  if (flat.fontFamily) return style;
  return [style, { fontFamily: jakarta(flat.fontWeight), fontWeight: 'normal' as const }];
}

let patched = false;

/**
 * Install the global Jakarta mapping. Idempotent; call once, before any text
 * renders (the root layout imports and invokes it at module scope).
 */
export function installFontPatch(): void {
  if (patched) return;
  patched = true;
  for (const Comp of [Text, TextInput] as unknown as Array<{ render?: (...a: unknown[]) => unknown }>) {
    const orig = Comp.render;
    if (typeof orig !== 'function') continue;
    Comp.render = function patchedRender(...args: unknown[]) {
      const el = orig.apply(this, args) as React.ReactElement<{ style?: unknown }> | null;
      if (!el || !React.isValidElement(el)) return el;
      return React.cloneElement(el, { style: withFamily(el.props.style) });
    };
  }
}
