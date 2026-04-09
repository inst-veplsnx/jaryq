import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import AccessibleButton from '../components/AccessibleButton';
import { announceForAccessibility } from '../utils/accessibility';

type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { signIn, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const passRef = useRef<TextInput>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
      e.email = 'Введите правильный email';
    if (!password) e.password = 'Введите пароль';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) {
      announceForAccessibility('Исправьте ошибки');
      return;
    }
    const result = await signIn(email.trim(), password);
    if (result.error) {
      const msg = result.error.includes('Invalid')
        ? 'Неверный email или пароль'
        : result.error;
      Alert.alert('Ошибка', msg);
      announceForAccessibility(`Ошибка: ${msg}`);
    }
  };

  const emailStyle: ViewStyle[] = [
    styles.input,
    errors.email ? styles.inputErr : styles.inputNormal,
  ];
  const passStyle: ViewStyle[] = [
    styles.input,
    errors.password ? styles.inputErr : styles.inputNormal,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="АудиоКнига. Экран входа."
          style={styles.header}
        >
          <Text style={styles.icon} accessible={false}>🎧</Text>
          <Text style={styles.appName} accessible={false}>АудиоКнига</Text>
          <Text style={styles.sub} accessible={false}>
            Войдите, чтобы продолжить
          </Text>
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label} accessible={true} accessibilityRole="text">
            Электронная почта
          </Text>
          <TextInput
            style={emailStyle}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErrors((p) => ({ ...p, email: '' }));
            }}
            placeholder="example@mail.ru"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()}
            accessible={true}
            accessibilityLabel="Поле электронная почта"
            accessibilityHint="Введите ваш адрес электронной почты"
          />
          {errors.email ? (
            <Text
              style={styles.err}
              accessibilityRole="alert"
              accessible={true}
            >
              {errors.email}
            </Text>
          ) : null}
        </View>

        {/* Пароль */}
        <View style={styles.field}>
          <Text style={styles.label} accessible={true} accessibilityRole="text">
            Пароль
          </Text>
          <TextInput
            ref={passRef}
            style={passStyle}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors((p) => ({ ...p, password: '' }));
            }}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            accessible={true}
            accessibilityLabel="Поле пароль"
            accessibilityHint="Введите ваш пароль"
          />
          {errors.password ? (
            <Text
              style={styles.err}
              accessibilityRole="alert"
              accessible={true}
            >
              {errors.password}
            </Text>
          ) : null}
        </View>

        <AccessibleButton
          label="Войти"
          hint="Дважды нажмите для входа"
          onPress={handleLogin}
          loading={loading}
          style={styles.btn}
        />
        <AccessibleButton
          label="Создать аккаунт"
          hint="Перейти к регистрации"
          onPress={() => navigation.navigate('Register')}
          variant="ghost"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 36 },
  icon: { fontSize: 64, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 6 },
  sub: { fontSize: 15, color: '#6B7280' },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 7 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    minHeight: 52,
  } as ViewStyle,
  inputNormal: { borderColor: '#D1D5DB' } as ViewStyle,
  inputErr: { borderColor: '#DC2626' } as ViewStyle,
  err: { fontSize: 13, color: '#DC2626', marginTop: 5 },
  btn: { marginTop: 8, marginBottom: 12 },
});