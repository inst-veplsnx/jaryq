import React from 'react';
import {
  View, Text, TextInput, TextInputProps, TouchableOpacity, StyleSheet,
} from 'react-native';
import Icon from './Icon';
import type { IconName } from './Icon';
import { colors, radii, spacing, a11y } from '../theme/designTokens';
import { useAppScale } from '../theme/useAppScale';

interface FormInputProps extends TextInputProps {
  label: string;
  icon: IconName;
  error?: string;
  focused?: boolean;
  showToggle?: boolean;
  showValue?: boolean;
  onToggleShow?: () => void;
}

const FormInput = React.forwardRef<TextInput, FormInputProps>(({
  label, icon, error, focused = false,
  showToggle = false, showValue = false, onToggleShow,
  ...textInputProps
}, ref) => {
  const { t, c } = useAppScale();
  const hasError = !!error;

  return (
    <View style={s.field}>
      <Text
        style={[s.label, { fontSize: t.sm, color: c.textSecondary }]}
        accessible={true}
        accessibilityRole="text"
      >
        {label}
      </Text>
      <View style={[
        s.inputRow,
        { backgroundColor: c.bgMain, borderColor: hasError ? colors.error : focused ? colors.primary : c.borderSoft },
        focused && s.inputRowFocused,
      ]}>
        <Icon
          name={icon}
          size={20}
          color={hasError ? colors.error : focused ? colors.primary : c.textMuted}
        />
        <TextInput
          ref={ref}
          style={[s.input, { fontSize: t.md, color: c.textPrimary }]}
          placeholderTextColor={colors.textPlaceholder}
          accessible={true}
          accessibilityLabel={label}
          {...textInputProps}
        />
        {showToggle && onToggleShow && (
          <TouchableOpacity
            onPress={onToggleShow}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={showValue ? 'Скрыть пароль' : 'Показать пароль'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={showValue ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={c.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {hasError && (
        <Text
          style={[s.err, { fontSize: t.xs }]}
          accessibilityRole="alert"
          accessible={true}
        >
          {error}
        </Text>
      )}
    </View>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;

export const formInputStyles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    minHeight: a11y.minTouchTarget,
  },
  inputRowFocused: { borderWidth: 2 },
  input: { flex: 1, paddingVertical: spacing.md },
  err: { color: colors.error, marginTop: 2 },
});

const s = formInputStyles;
