// ============================================================================
// Eventology Mobile — i18n
// ============================================================================
// Pulls translations from @eventology/locales (en + am). Stores the user's
// choice in SecureStore and exposes a React hook.
//
// Pure-dictionary translation helper: `t('common.cancel')` returns the
// nested value. Falls back to the key itself on missing entries so the UI
// degrades gracefully if a translation is added later.
// ============================================================================

import React from 'react';
import * as SecureStore from 'expo-secure-store';
import { getTranslations, type Locale, DEFAULT_LOCALE, LOCALES, LOCALE_NAMES } from '@eventology/locales';
import en from '@eventology/locales/src/en.json';
import type enType from '@eventology/locales/src/en.json';

type Translations = typeof enType;

const LOCALE_KEY = 'app:locale';

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
  t: (key: string) => string;
  ready: boolean;
}

function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cursor: unknown = obj;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

let _currentLocale: Locale = DEFAULT_LOCALE;
let _listeners: Array<(l: Locale) => void> = [];

function notify(l: Locale): void {
  _currentLocale = l;
  for (const fn of _listeners) fn(l);
}

export function getCurrentLocale(): Locale {
  return _currentLocale;
}

export async function loadStoredLocale(): Promise<Locale> {
  try {
    const stored = await SecureStore.getItemAsync(LOCALE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      _currentLocale = stored as Locale;
    }
  } catch {
    // SecureStore unavailable — fall back to default
  }
  return _currentLocale;
}

export async function persistLocale(l: Locale): Promise<void> {
  try {
    await SecureStore.setItemAsync(LOCALE_KEY, l);
  } catch {
    // Best-effort — non-blocking
  }
  notify(l);
}

export function useLocale(): LocaleState {
  const [locale, setLocaleState] = React.useState<Locale>(_currentLocale);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    void loadStoredLocale().then((l) => {
      if (!mounted) return;
      setLocaleState(l);
      setReady(true);
    });
    const listener = (l: Locale) => setLocaleState(l);
    _listeners.push(listener);
    return () => {
      mounted = false;
      _listeners = _listeners.filter((fn) => fn !== listener);
    };
  }, []);

  const translations = React.useMemo<Translations>(() => getTranslations(locale) as Translations, [locale]);

  const t = React.useCallback(
    (key: string): string => {
      return getNestedValue(translations, key) ?? key;
    },
    [translations]
  );

  const setLocale = React.useCallback(async (l: Locale) => {
    await persistLocale(l);
  }, []);

  return { locale, setLocale, t, ready };
}

export { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE };
export type { Locale };
export type { Translations };

// Re-export to make the import surface smaller
export { en };
