// ============================================================================
// EventImage — resilient banner image with a branded fallback
// ============================================================================
// The native counterpart of apps/web/src/components/shared/fallback-image.tsx.
// Two tiers:
//
//   Tier 1 — the remote banner via expo-image: disk+memory cached, decoded off
//            the JS thread, and faded in over the surface with a 200ms
//            transition. No opaque spinner overlay — the earlier RN <Image>
//            spinner sat on top of the photo until `onLoadEnd`, which on the
//            large detail hero read as "stuck / not loading."
//   Tier 2 — a brand gradient carrying the category icon and the event title,
//            shown when `uri` is NULL/empty or the load errors.
//
// An event with no photo should still look like an Eventology event, never a
// grey broken-image box.
// ============================================================================

import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gradient } from '@/components/ui/Gradient';
import { usePalette } from '@/lib/palette';
import { categoryIcon } from '@/lib/category';
import { colors, gradients, spacing, typography } from '@/lib/theme';

interface EventImageProps {
  uri?: string | null;
  /** Rendered inside the fallback so an image-less card still reads. */
  title?: string;
  categorySlug?: string | null;
  style?: StyleProp<ViewStyle>;
  /** Drawn over the image — scrims, pills, titles. */
  children?: React.ReactNode;
}

export function EventImage({
  uri,
  title,
  categorySlug,
  style,
  children,
}: EventImageProps): React.ReactElement {
  const p = usePalette();
  const hasUri = typeof uri === 'string' && uri.trim().length > 0;

  const [failed, setFailed] = React.useState(false);

  // A recycled FlatList row can hand us a new uri without remounting.
  React.useEffect(() => {
    setFailed(false);
  }, [uri]);

  const showFallback = !hasUri || failed;

  return (
    <View style={[styles.root, { backgroundColor: p.surfaceMuted }, style]}>
      {showFallback ? (
        <Gradient
          colors={p.isDark ? gradients.placeholderDark : gradients.placeholder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.fallbackBody}>
            <View style={styles.fallbackIcon}>
              <Ionicons name={categoryIcon(categorySlug)} size={22} color={colors.white} />
            </View>
            {title ? (
              <Text style={styles.fallbackTitle} numberOfLines={2}>
                {title}
              </Text>
            ) : null}
            <View style={styles.fallbackMetaRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={styles.fallbackMeta}>Addis Ababa</Text>
            </View>
          </View>
        </Gradient>
      ) : (
        <Image
          source={{ uri: uri as string }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={uri as string}
          onError={() => setFailed(true)}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative', overflow: 'hidden' },
  fallbackBody: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  fallbackIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  fallbackTitle: {
    ...typography.bodyBold,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  fallbackMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  fallbackMeta: { ...typography.small, color: 'rgba(255,255,255,0.85)' },
});
