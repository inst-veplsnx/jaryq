import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radii } from '../theme/designTokens';

interface SkeletonLineProps {
  width: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width, height = 14, borderRadius = radii.xs, style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: colors.borderLight, opacity }, style]}
      accessible={false}
    />
  );
};

export const SkeletonBookListItem: React.FC = () => (
  <View style={sk.row} accessible={false}>
    <SkeletonLine width={72} height={96} borderRadius={radii.md} style={sk.cover} />
    <View style={sk.info} accessible={false}>
      <SkeletonLine width="55%" height={11} style={sk.lineTop} />
      <SkeletonLine width="90%" height={16} style={sk.line} />
      <SkeletonLine width="70%" height={12} style={sk.line} />
      <SkeletonLine width="40%" height={11} />
    </View>
  </View>
);

export const SkeletonGenreCard: React.FC = () => (
  <View style={sk.genreCard} accessible={false}>
    <SkeletonLine width={60} height={60} borderRadius={radii.lg} style={sk.genreIcon} />
    <SkeletonLine width="70%" height={14} />
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <View
    accessible={true}
    accessibilityLabel="Загрузка..."
    accessibilityRole="progressbar"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBookListItem key={i} />
    ))}
  </View>
);

export const SkeletonGenreList: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <View
    style={sk.genreGrid}
    accessible={true}
    accessibilityLabel="Загрузка..."
    accessibilityRole="progressbar"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonGenreCard key={i} />
    ))}
  </View>
);

const sk = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    minHeight: 100,
  },
  cover: {
    marginRight: spacing.md,
    flexShrink: 0,
  },
  info: { flex: 1, gap: spacing.xs },
  lineTop: { marginBottom: spacing.xs },
  line: {},

  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  genreCard: {
    width: '47%',
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  genreIcon: { marginBottom: spacing.sm },
});
