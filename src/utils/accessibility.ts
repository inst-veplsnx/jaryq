import { AccessibilityInfo, findNodeHandle } from 'react-native';

export const announceForAccessibility = (msg: string) =>
  AccessibilityInfo.announceForAccessibility(msg);

export const setA11yFocus = (ref: any) => {
  if (ref?.current) {
    const node = findNodeHandle(ref.current);
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  }
};

export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

export const formatTimeVoice = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ч`);
  if (m > 0) parts.push(`${m} мин`);
  if (s > 0 && h === 0) parts.push(`${s} сек`);
  return parts.join(' ') || '0 сек';
};

const pad = (n: number) => String(n).padStart(2, '0');
