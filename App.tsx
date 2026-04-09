import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const { session, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={s.splash} accessible={true} accessibilityLabel="АудиоКнига загружается, пожалуйста подождите">
        <Text style={s.splashIcon} accessible={false}>🎧</Text>
        <Text style={s.splashTitle} accessible={false}>АудиоКнига</Text>
        <ActivityIndicator style={{ marginTop: 24 }} size="large" color="#2563EB" accessible={false} />
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
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  splashIcon: { fontSize: 80, marginBottom: 16 },
  splashTitle: { fontSize: 32, fontWeight: '800', color: '#111827' },
});
