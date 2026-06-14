// ============================================================================
// Auth route group — login + signup share a header
// ============================================================================
import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colors } from '@/lib/theme';

export default function AuthLayout(): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? colors.surfaceDark : colors.surface },
        headerTintColor: isDark ? colors.textDark : colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: isDark ? colors.backgroundDark : colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Sign in' }} />
      <Stack.Screen name="signup" options={{ title: 'Create account' }} />
    </Stack>
  );
}
