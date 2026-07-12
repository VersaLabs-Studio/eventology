// ============================================================================
// Input — labelled text field with icon, error state, password reveal
// ============================================================================
// The auth screens each hand-rolled a <Text label> + <TextInput> pair with the
// same 12 lines of light/dark styling. This is that pair, once.
// ============================================================================

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  leftIcon?: IoniconName;
  error?: string | null;
  /** Renders a reveal toggle and manages `secureTextEntry` internally. */
  password?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  leftIcon,
  error,
  password = false,
  containerStyle,
  ...rest
}: InputProps): React.ReactElement {
  const p = usePalette();
  const [focused, setFocused] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);

  const borderColor = error ? p.destructive : focused ? colors.primary : p.border;

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={[styles.label, { color: p.textMuted }]}>{label}</Text> : null}

      <View
        style={[
          styles.box,
          {
            backgroundColor: p.surface,
            borderColor,
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon ? <Ionicons name={leftIcon} size={17} color={focused ? colors.primary : p.textMuted} /> : null}

        <TextInput
          {...rest}
          style={[styles.input, { color: p.text }]}
          placeholderTextColor={p.textSubtle}
          secureTextEntry={password && !revealed}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />

        {password ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={18} color={p.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={[styles.error, { color: p.destructive }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs + 2 },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    minHeight: 52,
  },
  input: { flex: 1, ...typography.body, fontSize: 15, paddingVertical: spacing.md },
  error: { ...typography.small, fontSize: 11 },
});
