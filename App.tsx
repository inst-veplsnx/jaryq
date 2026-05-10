import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';
import { useDownloadStore } from './src/store/downloadStore';
import { colors, typography } from './src/theme/designTokens';

export default function App() {
  const { session, loading, initialize } = useAuthStore();
  const { loadSettings } = useSettingsStore();
  const { initialize: initializeDownloads } = useDownloadStore();

  useEffect(() => {
    initialize();
    loadSettings();
    initializeDownloads();
  }, []);

  if (loading) {
    return (
      <View style={s.splash} accessible={true} accessibilityLabel="Приложение JARYQ загружается, пожалуйста подождите">
        <View style={s.logoWrap} accessible={false}>
          <Image source={require('./assets/icon.png')} style={s.logoImg} />
        </View>
        <Text style={s.splashTitle} accessible={false}>JARYQ</Text>
        <Text style={s.splashSub} accessible={false}>Аудиокітапхана</Text>
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color={colors.primary} accessible={false} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator isAuth={!!session} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCard },
  logoWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  logoImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  splashTitle: {
    fontSize: typography.xxxl,
    fontWeight: typography.extrabold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  splashSub: {
    fontSize: typography.md,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: typography.medium,
  },
});
