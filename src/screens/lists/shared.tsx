import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon, { IconName } from '../../components/Icon';
import { colors, typography, radii, spacing, a11y, shadows, interaction } from '../../theme/designTokens';
export { SkeletonList, SkeletonGenreList } from '../../components/SkeletonLoader';

export const Loading = () => (
  <View style={s.center}>
    <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Загрузка..." />
  </View>
);

export const Empty = ({ text }: { text: string }) => (
  <Text style={s.empty} accessible={true} accessibilityRole="text">
    {text}
  </Text>
);

export const ListHeader = ({
  label,
  title,
  sub,
  count,
}: {
  label: string;
  title: string;
  sub?: string;
  count?: number;
}) => (
  <View accessible={true} accessibilityRole="header" accessibilityLabel={label} style={s.listHeader}>
    <Text style={s.listHeaderTitle} accessible={false}>{title}</Text>
    {sub
      ? <Text style={s.listHeaderSub} accessible={false}>{sub}</Text>
      : count !== undefined
        ? <Text style={s.listHeaderSub} accessible={false}>{count} кітап</Text>
        : null}
  </View>
);

export const EmptyState = ({
  icon,
  title,
  hint,
}: {
  icon: IconName;
  title: string;
  hint: string;
}) => (
  <View style={s.emptyBox}>
    <View style={s.emptyIconWrap}>
      <Icon name={icon} size={44} color={colors.primaryLight} />
    </View>
    <Text style={s.emptyTitle} accessible={true} accessibilityRole="text">{title}</Text>
    <Text style={s.emptyHint} accessible={false}>{hint}</Text>
  </View>
);

export const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={s.emptyBox}>
    <View style={[s.emptyIconWrap, s.errorIconWrap]}>
      <Icon name="wifi-outline" size={44} color={colors.error} />
    </View>
    <Text style={s.emptyTitle} accessible={true} accessibilityRole="alert">
      Жүктеу сәтсіз аяқталды
    </Text>
    <Text style={s.emptyHint} accessible={false}>
      Интернет байланысын тексеріңіз
    </Text>
    <TouchableOpacity
      style={s.retryBtn}
      onPress={onRetry}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Повторить попытку"
      accessibilityHint="Дважды нажмите для повторной загрузки"
      activeOpacity={interaction.activeOpacity}
    >
      <Text style={s.retryBtnTxt}>Қайталау</Text>
    </TouchableOpacity>
  </View>
);

export const FLATLIST_PERF_PROPS = {
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 12,
  removeClippedSubviews: true,
} as const;

export const contentPadBottom = { paddingBottom: spacing.xxxl };
export const contentPadBottomGrow = { paddingBottom: spacing.xxxl, flexGrow: 1 as const };

export const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bgMain },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },

  listHeader: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    marginBottom: 1,
  },
  listHeaderTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  listHeaderSub: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: 3,
  },

  empty: {
    textAlign: 'center',
    marginTop: spacing.xxxl,
    fontSize: typography.md,
    color: colors.textMuted,
  },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: typography.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  errorIconWrap: {
    backgroundColor: colors.errorSoft,
    borderColor: colors.error,
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    minHeight: a11y.minTouchTargetSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnTxt: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textOnPrimary,
  },

  genreRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  genreCard: {
    flex: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  genreIconWrap: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  genreName: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    textAlign: 'center',
    lineHeight: 20,
  },
});
