import React from "react";
import { Stack } from "expo-router";
import { colors } from "../../lib/theme";

/**
 * Auth route group layout.
 *
 * Hosts the unauthenticated flow (`login`, `signup`) as a
 * headerless stack painted with the app's background color so
 * the visual transition into the authenticated tabs is seamless.
 *
 * Adding a new auth screen (e.g. `forgot-password.tsx`) is
 * automatic — Expo Router discovers it by filename; no edits
 * required here.
 */
export default function AuthLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
