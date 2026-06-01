/**
 * Eventology Mobile — Search Tab
 * Debounced text search over the mock event catalogue, with recent
 * search history (persisted via `useStore`), an "AI Search" toggle
 * (visual only — V2 will wire this up), and a 2-col results grid.
 *
 * Filtering: title / category name / short description (case-insensitive
 * substring match on the debounced query).
 */
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  Switch,
  Keyboard,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import EmptyState from "../../components/EmptyState";
import EventCard from "../../components/EventCard";
import { useDebounce } from "../../hooks/use-debounce";
import { useStore } from "../../hooks/use-store";
import { events } from "../../lib/mock-data";
import { colors, radius, spacing, typography } from "../../lib/theme";
import type { Event } from "../../lib/types";

// ─── Inline SearchBar ────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
  inputRef: React.RefObject<TextInput | null>;
}

function SearchBar({
  value,
  onChangeText,
  onSubmit,
  inputRef,
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText("");
    inputRef.current?.focus();
  };

  return (
    <View style={styles.searchBar}>
      <Ionicons
        name="search-outline"
        size={20}
        color={colors.muted}
        style={styles.searchIcon}
      />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Search events, categories, descriptions…"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.searchInput}
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

// ─── Inline RecentSearch Row ─────────────────────────────────────────────────
interface RecentItemProps {
  query: string;
  onPress: () => void;
  onRemove: () => void;
}

function RecentItem({ query, onPress, onRemove }: RecentItemProps) {
  return (
    <View style={styles.recentRow}>
      <Pressable
        onPress={onPress}
        style={styles.recentRowPressable}
        accessibilityRole="button"
      >
        <Ionicons name="time-outline" size={18} color={colors.muted} />
        <Text style={styles.recentText} numberOfLines={1}>
          {query}
        </Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        style={styles.recentRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${query} from recent searches`}
      >
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const { state, addRecentSearch } = useStore();

  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 300);
  const [hiddenRecents, setHiddenRecents] = useState<Set<string>>(
    () => new Set<string>()
  );
  const [aiSearch, setAiSearch] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  // Recents minus client-side "dismissed" entries. Note: dismissed
  // recents are NOT removed from the persisted store — they only
  // disappear from this screen's view (per spec).
  const visibleRecents = useMemo<string[]>(
    () => state.recentSearches.filter((s) => !hiddenRecents.has(s)),
    [state.recentSearches, hiddenRecents]
  );

  // Results: title / category / description substring match.
  const results = useMemo<Event[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length === 0) return [];
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.name.toLowerCase().includes(q) ||
        e.shortDescription.toLowerCase().includes(q)
    );
  }, [debouncedQuery]);

  const showResults = debouncedQuery.trim().length > 0;
  const showRecents = !showResults && visibleRecents.length > 0;

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      addRecentSearch(trimmed);
    }
    Keyboard.dismiss();
  };

  const handleRecentPress = (s: string) => {
    setQuery(s);
    inputRef.current?.focus();
  };

  const handleRemoveRecent = (s: string) => {
    setHiddenRecents((prev) => {
      const next = new Set(prev);
      next.add(s);
      return next;
    });
  };

  const renderResultItem = ({ item, index }: ListRenderItemInfo<Event>) => (
    <Animated.View
      entering={FadeIn.delay(index * 30).duration(280)}
      style={styles.listCell}
    >
      <EventCard event={item} />
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.heroTitle}>Search</Text>
      </View>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={handleSubmit}
        inputRef={inputRef}
      />

      <View style={styles.aiRow}>
        <View style={styles.aiLabelGroup}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.aiLabel}>AI Search</Text>
        </View>
        <Switch
          value={aiSearch}
          onValueChange={setAiSearch}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.border}
        />
      </View>

      {showResults ? (
        results.length > 0 ? (
          <FlatList
            data={results}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.listRow}
            keyboardShouldPersistTaps="handled"
            renderItem={renderResultItem}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            icon="search-outline"
            title="No events found"
            description="Try a different search term or browse categories on Discover."
          />
        )
      ) : showRecents ? (
        <View style={styles.recentsSection}>
          <Text style={styles.sectionTitle}>Recent searches</Text>
          <FlatList
            data={visibleRecents}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <RecentItem
                query={item}
                onPress={() => handleRecentPress(item)}
                onRemove={() => handleRemoveRecent(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <EmptyState
          icon="compass-outline"
          title="Start searching"
          description="Type a keyword to find events by title, category, or description."
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.foreground,
  },

  // SearchBar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.foreground,
    paddingVertical: 0,
  },

  // AI Search toggle row
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  aiLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  aiLabel: {
    ...typography.bodyBold,
    color: colors.foreground,
  },

  // Recents
  recentsSection: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.foreground,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentRowPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  recentText: {
    ...typography.body,
    color: colors.foreground,
    flex: 1,
  },
  recentRemove: {
    padding: spacing.xs,
  },

  // Results list
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  listCell: { flex: 1 },
});
