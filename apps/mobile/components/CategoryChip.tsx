import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography } from "../lib/theme";
import type { Category } from "../lib/mock-data";

interface CategoryChipProps {
  category: Category;
  selected: boolean;
  onPress: () => void;
}

export default function CategoryChip({ category, selected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: category.color, borderColor: category.color },
      ]}
    >
      <Ionicons
        name={category.icon as keyof typeof Ionicons.glyphMap}
        size={14}
        color={selected ? colors.white : category.color}
      />
      <Text
        style={[
          styles.chipText,
          selected && { color: colors.white },
          !selected && { color: category.color },
        ]}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  chipText: {
    ...typography.caption,
    fontWeight: "600",
  },
});
