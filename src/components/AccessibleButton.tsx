import React, { useRef } from 'react';
import {
  Pressable, Text, StyleSheet, Animated,
  ViewStyle, ActivityIndicator,
} from 'react-native';
import { colors, radii, a11y, spacing, interaction } from '../theme/designTokens';
import { useAppScale } from '../theme/useAppScale';

interface Props {
  label: string;
  a11yLabel?: string;
  hint?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const AccessibleButton: React.FC<Props> = React.memo(({
  label, a11yLabel, hint, onPress, variant = 'primary',
  disabled = false, loading = false, style,
}) => {
  const { t } = useAppScale();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, {
    toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4,
  }).start();

  const onPressOut = () => Animated.spring(scale, {
    toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6,
  }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: disabled || loading }}
      hitSlop={interaction.hitSlopSmall}
    >
      <Animated.View
        style={[styles.base, styles[variant], disabled && styles.disabled, style, { transform: [{ scale }] }]}
      >
        {loading
          ? <ActivityIndicator
              color={variant === 'primary' || variant === 'danger' ? colors.textOnPrimary : colors.primary}
              accessible={false}
            />
          : <Text
              style={[styles.text, styles[`${variant}Text` as keyof typeof styles], { fontSize: t.lg }]}
              accessible={false}
            >
              {label}
            </Text>
        }
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: a11y.minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadowOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
    shadowColor: 'rgba(220, 38, 38, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  disabled: { opacity: 0.45 },

  text: { fontWeight: '600' },
  primaryText: { color: colors.textOnPrimary },
  secondaryText: { color: colors.primary },
  ghostText: { color: colors.textSecondary },
  dangerText: { color: colors.textOnPrimary },
});

export default AccessibleButton;
