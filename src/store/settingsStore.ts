import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  keepScreenOn: boolean;
  autoSave: boolean;
  largeText: boolean;
  highContrast: boolean;
  speed: number;
  loading: boolean;
  loadSettings: () => Promise<void>;
  setKeepScreenOn: (value: boolean) => Promise<void>;
  setAutoSave: (value: boolean) => Promise<void>;
  setLargeText: (value: boolean) => Promise<void>;
  setHighContrast: (value: boolean) => Promise<void>;
  setSpeed: (value: number) => Promise<void>;
}

const SETTINGS_KEY = '@audiobook_settings';

const defaultSettings = {
  keepScreenOn: true,
  autoSave: true,
  largeText: false,
  highContrast: false,
  speed: 1.0,
};

type PersistedSettings = {
  keepScreenOn: boolean;
  autoSave: boolean;
  largeText: boolean;
  highContrast: boolean;
  speed: number;
};

const PERSISTED_KEYS: (keyof PersistedSettings)[] = [
  'keepScreenOn', 'autoSave', 'largeText', 'highContrast', 'speed',
];

async function persistUpdate(
  get: () => SettingsState,
  patch: Partial<PersistedSettings>,
): Promise<void> {
  const current = get();
  const payload = PERSISTED_KEYS.reduce((acc, k) => {
    acc[k] = (patch[k] !== undefined ? patch[k] : current[k]) as any;
    return acc;
  }, {} as Record<keyof PersistedSettings, unknown>);
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  loading: false,

  loadSettings: async () => {
    try {
      set({ loading: true });
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set({
          keepScreenOn: settings.keepScreenOn ?? defaultSettings.keepScreenOn,
          autoSave: settings.autoSave ?? defaultSettings.autoSave,
          largeText: settings.largeText ?? defaultSettings.largeText,
          highContrast: settings.highContrast ?? defaultSettings.highContrast,
          speed: settings.speed ?? defaultSettings.speed,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      set({ loading: false });
    }
  },

  setKeepScreenOn: async (value: boolean) => {
    await persistUpdate(get, { keepScreenOn: value });
    set({ keepScreenOn: value });
  },

  setAutoSave: async (value: boolean) => {
    await persistUpdate(get, { autoSave: value });
    set({ autoSave: value });
  },

  setLargeText: async (value: boolean) => {
    await persistUpdate(get, { largeText: value });
    set({ largeText: value });
  },

  setHighContrast: async (value: boolean) => {
    await persistUpdate(get, { highContrast: value });
    set({ highContrast: value });
  },

  setSpeed: async (value: number) => {
    await persistUpdate(get, { speed: value });
    set({ speed: value });
  },
}));
