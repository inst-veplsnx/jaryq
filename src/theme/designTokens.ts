// Design tokens JARYQ — white/black with orange accent

export const colors = {
  // Brand orange
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FB923C',
  primarySoft: '#FFF4ED',
  primaryMed: '#FDBA74',
  primaryPressed: '#C2410C',

  // Backgrounds — clean white/light gray
  bgMain: '#F5F5F5',
  bgCard: '#FFFFFF',
  bgSoft: '#FAFAFA',
  bgElevated: '#FFFFFF',
  bgDanger: '#FEF2F2',

  // Text — near-black to muted gray
  textPrimary: '#0F0F0F',
  textSecondary: '#3B3B3B',
  textMuted: '#888888',
  textPlaceholder: '#BBBBBB',
  textOnPrimary: '#FFFFFF',

  // Borders — light neutral gray
  borderLight: '#E8E8E8',
  borderSoft: '#EEEEEE',
  borderFocus: '#F97316',
  divider: '#E5E5E5',

  // Status colors
  success: '#16A34A',
  successSoft: '#F0FDF4',
  successBorder: '#BBF7D0',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  errorBorder: '#FECACA',
  info: '#0284C7',
  infoSoft: '#EFF6FF',

  // Category accent colors (used by HomeScreen menu and GenresScreen)
  accentBlue: '#0EA5E9',    accentBlueSoft: '#F0F9FF',
  accentRed: '#EF4444',     accentRedSoft: '#FEF2F2',
  accentPurple: '#8B5CF6',  accentPurpleSoft: '#F5F3FF',
  accentPink: '#EC4899',    accentPinkSoft: '#FDF2F8',
  accentGreen: '#22C55E',   accentGreenSoft: '#F0FDF4',
  accentAmber: '#F59E0B',   accentAmberSoft: '#FFFBEB',
  accentFuchsia: '#D946EF', accentFuchsiaSoft: '#FDF4FF',
  accentCyan: '#06B6D4',    accentCyanSoft: '#F0FDFF',
  accentRose: '#F43F5E',    accentRoseSoft: '#FFF1F2',
  accentLime: '#84CC16',    accentLimeSoft: '#F7FEE7',

  // UI chrome
  tabInactive: '#9CA3AF',

  // Shadows — neutral dark
  shadowSm: 'rgba(0, 0, 0, 0.06)',
  shadowMd: 'rgba(0, 0, 0, 0.10)',
  shadowLg: 'rgba(0, 0, 0, 0.16)',
  shadowOrange: 'rgba(249, 115, 22, 0.22)',
};

export const spacing = {
  micro: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const typography = {
  xs: 13,
  sm: 15,
  md: 17,
  lg: 19,
  xl: 22,
  xxl: 27,
  xxxl: 34,
  display: 40,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const shadows = {
  xs: {
    shadowColor: colors.shadowSm,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.shadowSm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadowMd,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadowLg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  orange: {
    shadowColor: colors.shadowOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const a11y = {
  minTouchTarget: 52,
  minTouchTargetSmall: 44,
  sliderMinHeight: 44,
  focusRingWidth: 3,
};

export const interaction = {
  activeOpacity: 0.75,
  hitSlopSmall: { top: 8, bottom: 8, left: 8, right: 8 },
  hitSlopStd:   { top: 12, bottom: 12, left: 12, right: 12 },
};
