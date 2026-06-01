import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../lib/theme";
import { t } from "../../lib/i18n";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

// Tab copy is sourced through the i18n stub so V2 can localize without
// touching the navigation tree. V1 returns the key verbatim (e.g. "tab.home").
const TAB_CONFIG: TabConfig[] = [
  { name: "index", title: t("tab.home"), icon: "home-outline", iconActive: "home" },
  { name: "discover", title: t("tab.discover"), icon: "compass-outline", iconActive: "compass" },
  { name: "search", title: t("tab.search"), icon: "search-outline", iconActive: "search" },
  { name: "tickets", title: t("tab.tickets"), icon: "ticket-outline", iconActive: "ticket" },
  { name: "profile", title: t("tab.profile"), icon: "person-circle-outline", iconActive: "person-circle" },
];

export default function TabLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingTop: 4,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={size ?? 22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
