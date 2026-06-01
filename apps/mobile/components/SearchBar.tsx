/**
 * Eventology Mobile — SearchBar
 * Dual-mode search input.
 *
 *  - **Editable** (default): a real `TextInput` with focus animation
 *    and a clear button when the query is non-empty. T3 will own the
 *    search route and the submit handler.
 *  - **Read-only** (when `onPress` is passed): a tappable pill that
 *    navigates to `/search` on press. Used on the home tab where we
 *    don't want the keyboard popping up unsolicited.
 *
 * Height is 44pt to satisfy the minimum touch-target spec.
 */
import React, { useRef, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  type FocusEvent,
} from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, radius, spacing, typography } from "../lib/theme";

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  /**
   * If provided, the bar becomes a tappable pill that fires this handler
   * on press (and navigates nowhere by default). Omit to enable the
   * editable `TextInput` mode.
   */
  onPress?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BORDER_INACTIVE = colors.border;
const BORDER_ACTIVE = colors.primary;

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onPress,
  placeholder = "Search events, organizers, places…",
  autoFocus = false,
  style,
}: SearchBarProps): React.ReactElement {
  const router = useRouter();
  const [internalValue, setInternalValue] = useState<string>(value ?? "");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const border = useSharedValue<number>(0);
  const inputRef = useRef<TextInput>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? (value as string) : internalValue;
  const isReadOnly = onPress !== undefined;

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      border.value,
      [0, 1],
      [BORDER_INACTIVE, BORDER_ACTIVE],
    ),
  }));

  const handleFocus = (_e: FocusEvent) => {
    setIsFocused(true);
    border.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    border.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  };

  const handleClear = () => {
    if (isControlled) {
      onChangeText?.("");
    } else {
      setInternalValue("");
    }
    inputRef.current?.focus();
  };

  const handlePress = () => {
    onPress?.();
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(currentValue);
    } else if (currentValue.trim().length > 0) {
      router.push({
        pathname: "/search",
        params: { q: currentValue.trim() },
      });
    }
  };

  const iconColor = isFocused ? colors.primary : colors.muted;

  // ── Read-only mode: tap-to-navigate pill ───────────────────────────────
  if (isReadOnly) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          pressed ? styles.pressed : null,
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open search"
      >
        <Ionicons
          name="search"
          size={18}
          color={colors.muted}
          style={styles.iconLeft}
        />
        <Text
          style={[
            styles.placeholder,
            currentValue.length > 0 ? styles.placeholderFilled : null,
          ]}
          numberOfLines={1}
        >
          {currentValue.length > 0 ? currentValue : placeholder}
        </Text>
      </Pressable>
    );
  }

  // ── Editable mode: TextInput with focus animation ──────────────────────
  return (
    <Animated.View style={[styles.container, animatedBorder, style]}>
      <Ionicons
        name="search"
        size={18}
        color={iconColor}
        style={styles.iconLeft}
      />
      <TextInput
        ref={inputRef}
        value={currentValue}
        onChangeText={(text) => {
          if (!isControlled) setInternalValue(text);
          onChangeText?.(text);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={styles.input}
        accessibilityLabel="Search events"
      />
      {currentValue.length > 0 ? (
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          style={({ pressed }) => [styles.iconRight, pressed ? styles.iconPressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
    padding: 2,
  },
  iconPressed: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.foreground,
    paddingVertical: 0, // normalize across iOS/Android
  },
  placeholder: {
    flex: 1,
    ...typography.body,
    color: colors.mutedLight,
  },
  placeholderFilled: {
    color: colors.foreground,
  },
});
