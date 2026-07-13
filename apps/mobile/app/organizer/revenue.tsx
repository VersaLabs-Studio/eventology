// ============================================================================
// Organizer revenue — V1.5 closeout (read-only)
// ============================================================================
// Balance summary from GET /api/protected/payouts/balance + payout history
// from GET /api/protected/payouts. Requesting a payout stays web-only
// (payments seam, stubbed) — mobile is read-only here.
// ============================================================================

import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Gradient } from '@/components/ui/Gradient';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';
import { formatETB } from '@eventology/utils';

interface Balance {
  totalEarned: number;
  totalPaidOut: number;
  totalRefunded: number;
  availableBalance: number;
  currency: string;
}

interface PayoutRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  method?: string | null;
}

interface PayoutsResponse {
  data: PayoutRow[];
  meta: { total: number };
}

function payoutVariant(status: string): 'success' | 'outline' | 'destructive' | 'warning' {
  switch (status) {
    case 'completed':
    case 'paid':
      return 'success';
    case 'pending':
    case 'processing':
      return 'warning';
    case 'failed':
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function OrganizerRevenueScreen(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();

  const balanceQ = useQuery({
    queryKey: ['organizer', 'balance'],
    queryFn: () => api.get<Balance>('/api/protected/payouts/balance'),
  });
  const payoutsQ = useQuery({
    queryKey: ['organizer', 'payouts'],
    queryFn: () => api.get<PayoutsResponse>('/api/protected/payouts'),
  });

  const b = balanceQ.data;
  const payouts = payoutsQ.data?.data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <FlatList
          data={payouts}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={balanceQ.isFetching || payoutsQ.isFetching}
              onRefresh={() => {
                balanceQ.refetch();
                payoutsQ.refetch();
              }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
              {balanceQ.isLoading ? (
                <Skeleton height={150} radius={16} />
              ) : (
                <Gradient
                  colors={gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.balanceCard, shadows.md]}
                >
                  <Text style={styles.balanceLabel}>{t('organizer.revenue.available')}</Text>
                  <Text style={styles.balanceValue}>
                    {formatETB(b?.availableBalance ?? 0)}
                  </Text>
                  <View style={styles.balanceRow}>
                    <View style={styles.balanceCell}>
                      <Text style={styles.cellLabel}>{t('organizer.revenue.earned')}</Text>
                      <Text style={styles.cellValue}>{formatETB(b?.totalEarned ?? 0)}</Text>
                    </View>
                    <View style={styles.balanceCell}>
                      <Text style={styles.cellLabel}>{t('organizer.revenue.paidOut')}</Text>
                      <Text style={styles.cellValue}>{formatETB(b?.totalPaidOut ?? 0)}</Text>
                    </View>
                    <View style={styles.balanceCell}>
                      <Text style={styles.cellLabel}>{t('organizer.revenue.refunded')}</Text>
                      <Text style={styles.cellValue}>{formatETB(b?.totalRefunded ?? 0)}</Text>
                    </View>
                  </View>
                </Gradient>
              )}

              <Text style={[styles.sectionTitle, { color: p.text }]}>
                {t('organizer.revenue.history')}
              </Text>
              <Text style={[styles.note, { color: p.textSubtle }]}>
                {t('organizer.revenue.webOnlyNote')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: p.surface, borderColor: p.border }]}>
              <View style={[styles.iconWrap, { backgroundColor: p.surfaceMuted }]}>
                <Ionicons name="cash-outline" size={18} color={p.textMuted} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.rowAmount, { color: p.text }]}>{formatETB(item.amount)}</Text>
                <Text style={[styles.rowDate, { color: p.textMuted }]}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Badge label={item.status} variant={payoutVariant(item.status)} />
            </View>
          )}
          ListEmptyComponent={
            payoutsQ.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={64} radius={12} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="cash-outline"
                title={t('organizer.revenue.empty')}
                description={t('organizer.revenue.emptyBody')}
              />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },

  balanceCard: { borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden', gap: spacing.xs },
  balanceLabel: { ...typography.caption, fontSize: 12, color: 'rgba(255,255,255,0.82)' },
  balanceValue: { ...typography.h1, fontSize: 32, color: colors.white, fontWeight: '800' },
  balanceRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  balanceCell: { flex: 1, minWidth: 0 },
  cellLabel: { fontSize: 10, color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: 0.5 },
  cellValue: { fontSize: 13, color: colors.white, fontWeight: '700', marginTop: 2 },

  sectionTitle: { ...typography.h2, fontSize: 16 },
  note: { ...typography.small, fontSize: 11, marginTop: -spacing.xs },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowAmount: { ...typography.bodyBold, fontSize: 15 },
  rowDate: { ...typography.caption, fontSize: 12, marginTop: 1 },
});
