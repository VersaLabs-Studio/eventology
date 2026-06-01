import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider } from "../hooks/use-store";
import { ToastProvider } from "../components/Toast";

/**
 * Root layout for Eventology mobile.
 *
 * Wraps the entire navigation tree in three providers, in order:
 *   1. SafeAreaProvider — gives useSafeAreaInsets() to every screen
 *   2. StoreProvider    — global app state (favorites, recents, view history)
 *   3. ToastProvider    — bottom-sheet toast notifications
 *
 * The Stack itself is unstyled (headerShown: false) so each tab / screen
 * group can declare its own header treatment.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </ToastProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
