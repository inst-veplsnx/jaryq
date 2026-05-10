import { useSettingsStore } from '../store/settingsStore';
import { colors as baseColors, typography as baseTypography } from './designTokens';

export function useAppScale() {
  const largeText = useSettingsStore(s => s.largeText);
  const highContrast = useSettingsStore(s => s.highContrast);

  const scale = largeText ? 1.18 : 1;

  const t = {
    ...baseTypography,
    xs: Math.round(baseTypography.xs * scale),
    sm: Math.round(baseTypography.sm * scale),
    md: Math.round(baseTypography.md * scale),
    lg: Math.round(baseTypography.lg * scale),
    xl: Math.round(baseTypography.xl * scale),
    xxl: Math.round(baseTypography.xxl * scale),
    xxxl: Math.round(baseTypography.xxxl * scale),
    display: Math.round(baseTypography.display * scale),
  };

  const c = highContrast
    ? {
        ...baseColors,
        textPrimary: '#000000',
        textSecondary: '#111111',
        textMuted: '#333333',
        textPlaceholder: '#666666',
        borderSoft: '#888888',
        borderLight: '#666666',
        bgMain: '#FFFFFF',
        bgCard: '#FFFFFF',
      }
    : baseColors;

  return { t, c, scale, largeText, highContrast };
}
