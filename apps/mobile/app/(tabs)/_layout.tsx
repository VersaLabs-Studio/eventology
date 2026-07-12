// ============================================================================
// Bottom-tab layout
// ============================================================================
// 5 tabs: Discover · Search · My Tickets · Inbox · Profile.
//
// Icons swap to their filled variant when focused — the outline-only tab bar
// read as uniformly inactive. Heights are set explicitly because the default
// bar is too short for a gesture-navigation device once the home indicator
// inset is applied.
// ============================================================================

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '@/lib/palette';
import { AiChatFab } from '@/components/ai/AiChatFab';
import { colors, typography } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Outline when inactive, solid when focused. */
function tabIcon(outline: IoniconName, solid: IoniconName) {
  return function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={focused ? solid : outline} size={size} color={color} />;
  };
}

export default function TabsLayout(): React.ReactElement {
  const p = usePalette();
  const insets = useSafeAreaInsets();

  const barHeight = 58 + insets.bottom;

  return (
    <View style={styles.root}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: {
          backgroundColor: p.surface,
          borderTopColor: p.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 0,
        },
        tabBarLabelStyle: {
          ...typography.small,
          fontSize: 10,
          fontWeight: '700',
          marginTop: Platform.OS === 'android' ? 0 : 2,
        },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Discover', tabBarIcon: tabIcon('compass-outline', 'compass') }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Search', tabBarIcon: tabIcon('search-outline', 'search') }}
      />
      <Tabs.Screen
        name="tickets"
        options={{ title: 'Tickets', tabBarIcon: tabIcon('ticket-outline', 'ticket') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Inbox', tabBarIcon: tabIcon('notifications-outline', 'notifications') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
      <AiChatFab />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
