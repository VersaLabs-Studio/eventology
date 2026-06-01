/**
 * Eventology Mobile — FilterSheet
 * Modal bottom sheet for the discover screen filters. T3 will own
 * the consumer side (open/close, applying the result); T2 ships the
 * surface, state, and Apply/Reset handlers as a self-contained unit.
 *
 * Sections: Sort · Category · Price · City. The sort options come
 * from `SORT_OPTIONS`; the city list from `CITIES`. All values are
 * lifted to typed constants in `lib/constants` so this sheet never
 * has to hardcode content.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, typography } from "../lib/theme";
import { CITIES, FILTER_CATEGORIES, SORT_OPTIONS } from "../lib/constants";
import type { Category, SortOption } from "../lib/types";
import type { City } from "../lib/constants";

import { Button } from "./ui/Button";

export interface FilterState {
  sort: SortOption;
  categories: string[]; // category ids
  city: City | "all";
  priceType: "all" | "free" | "paid";
}

export const DEFAULT_FILTERS: FilterState = {
  sort: "trending",
  categories: [],
  city: "all",
  priceType: "all",
};

interface FilterSheetProps {
  visible: boolean;
  initial?: FilterState;
  onClose: () => void;
  onApply: (next: FilterState) => void;
  onReset?: () => void;
}

export function FilterSheet({
  visible,
  initial = DEFAULT_FILTERS,
  onClose,
  onApply,
  onReset,
}: FilterSheetProps): React.ReactElement {
  const [draft, setDraft] = useState<FilterState>(initial);

  // Reset the working draft each time the sheet opens so we never
  // commit a partial edit from a previous session.
  useEffect(() => {
    if (visible) {
      setDraft(initial);
    }
  }, [visible, initial]);

  const toggleCategory = useCallback((id: string) => {
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(id)
        ? d.categories.filter((c) => c !== id)
        : [...d.categories, id],
    }));
  }, []);

  const setPrice = useCallback((priceType: FilterState["priceType"]) => {
    setDraft((d) => ({ ...d, priceType }));
  }, []);

  const setCity = useCallback((city: FilterState["city"]) => {
    setDraft((d) => ({ ...d, city }));
  }, []);

  const setSort = useCallback((sort: SortOption) => {
    setDraft((d) => ({ ...d, sort }));
  }, []);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    onReset?.();
  };

  const cityOptions: { value: City | "all"; label: string }[] = [
    { value: "all", label: "All cities" },
    ...CITIES.map((c) => ({ value: c, label: c })),
  ];

  const priceOptions: { value: FilterState["priceType"]; label: string }[] = [
    { value: "all", label: "All" },
    { value: "free", label: "Free" },
    { value: "paid", label: "Paid" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.headerIcon, pressed ? styles.iconPressed : null]}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.title}>Filters</Text>
          <Pressable
            onPress={handleReset}
            hitSlop={8}
            style={({ pressed }) => [styles.headerAction, pressed ? styles.iconPressed : null]}
            accessibilityRole="button"
            accessibilityLabel="Reset filters"
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Section title="Sort by">
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map((opt) => {
                const active = draft.sort === opt.value;
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    active={active}
                    onPress={() => setSort(opt.value)}
                  />
                );
              })}
            </View>
          </Section>

          <Section title="Category">
            <View style={styles.chipRow}>
              {FILTER_CATEGORIES.map((cat: Category) => {
                const active = draft.categories.includes(cat.id);
                return (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    iconName={cat.icon as keyof typeof Ionicons.glyphMap}
                    iconColor={cat.color}
                    active={active}
                    activeColor={cat.color}
                    onPress={() => toggleCategory(cat.id)}
                  />
                );
              })}
            </View>
          </Section>

          <Section title="Price">
            <View style={styles.chipRow}>
              {priceOptions.map((opt) => {
                const active = draft.priceType === opt.value;
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    active={active}
                    onPress={() => setPrice(opt.value)}
                  />
                );
              })}
            </View>
          </Section>

          <Section title="City">
            <View style={styles.chipRow}>
              {cityOptions.map((opt) => {
                const active = draft.city === opt.value;
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    active={active}
                    onPress={() => setCity(opt.value)}
                  />
                );
              })}
            </View>
          </Section>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            label="Apply filters"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleApply}
            rightIcon="checkmark"
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Local primitives ────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  activeColor?: string;
}

function Chip({
  label,
  active,
  onPress,
  iconName,
  iconColor,
  activeColor,
}: ChipProps): React.ReactElement {
  const accent = activeColor ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? { backgroundColor: accent, borderColor: accent } : null,
        pressed && !active ? styles.chipPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {iconName ? (
        <Ionicons
          name={iconName}
          size={14}
          color={active ? colors.white : iconColor ?? colors.muted}
        />
      ) : null}
      <Text
        style={[
          styles.chipText,
          active ? { color: colors.white } : { color: colors.foreground },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAction: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  iconPressed: {
    opacity: 0.5,
  },
  title: {
    ...typography.h2,
    color: colors.foreground,
  },
  resetText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
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
    minHeight: 36,
  },
  chipPressed: {
    backgroundColor: colors.background,
  },
  chipText: {
    ...typography.caption,
    fontWeight: "600",
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
