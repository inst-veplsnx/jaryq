import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet,
  ViewStyle, ActivityIndicator, View,
} from 'react-native';

interface Props {
  label: string;
  hint?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const AccessibleButton: React.FC<Props> = ({
  label, hint, onPress, variant = 'primary',
  disabled = false, loading = false, style,
}) => (
  <TouchableOpacity
    style={[styles.base, styles[variant], disabled && styles.disabled, style]}
    onPress={onPress}
    disabled={disabled || loading}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={hint}
    accessibilityState={{ disabled: disabled || loading }}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    {loading
      ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#2563EB'} accessible={false} />
      : <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles]]} accessible={false}>{label}</Text>
    }
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: {
    minHeight: 52, paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#2563EB' },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#DC2626' },
  disabled: { opacity: 0.45 },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#fff' },
  secondaryText: { color: '#2563EB' },
  ghostText: { color: '#374151' },
  dangerText: { color: '#fff' },
});

export default AccessibleButton;
