import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
  Dimensions, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import AccessibleButton from '../components/AccessibleButton';
import FormInput from '../components/FormInput';
import { announceForAccessibility } from '../utils/accessibility';
import { validateEmail, validatePassword } from '../utils/validation';
import { colors, spacing } from '../theme/designTokens';
import { useAppScale } from '../theme/useAppScale';

const { height: SCREEN_H } = Dimensions.get('window');
type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { signIn, loading } = useAuthStore();
  const { t, c } = useAppScale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const passRef = useRef<TextInput>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) e.password = passErr;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) {
      announceForAccessibility('Исправьте ошибки');
      return;
    }
    try {
      const result = await signIn(email.trim(), password);
      if (result.error) {
        const msg = result.error.includes('Invalid') ? 'Қате email немесе құпия сөз' : result.error;
        Alert.alert('Кіру қатесі', msg);
        announceForAccessibility(`Ошибка: ${msg}`);
      }
    } catch {
      Alert.alert('Қате', 'Сервермен байланыс жоқ');
      announceForAccessibility('Ошибка: нет соединения с сервером');
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Цветная шапка */}
      <View
        style={s.hero}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="JARYQ. Экран входа."
      >
        <View style={s.logoRing} accessible={false}>
          <Image source={require('../../assets/icon.png')} style={s.logoImg} />
        </View>
        <Text style={[s.appName, { fontSize: t.xxxl }]} accessible={false}>JARYQ</Text>
        <Text style={[s.appSub, { fontSize: t.sm }]} accessible={false}>Аудиокітапхана</Text>
      </View>

      {/* Белый «лист» поверх шапки */}
      <ScrollView
        style={s.sheet}
        contentContainerStyle={s.sheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={[s.sheetTitle, { fontSize: t.xxl, color: c.textPrimary }]} accessible={false}>
          Қош келдіңіз
        </Text>
        <Text style={[s.sheetSub, { fontSize: t.md, color: c.textMuted }]} accessible={false}>
          Аккаунтыңызға кіріңіз
        </Text>

        <FormInput
          label="Электрондық пошта"
          icon="mail-outline"
          value={email}
          onChangeText={(v) => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
          placeholder="example@mail.ru"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          focused={emailFocused}
          error={errors.email}
          accessibilityLabel="Электронная почта"
          accessibilityHint="Введите ваш адрес электронной почты"
        />

        <FormInput
          ref={passRef}
          label="Құпия сөз"
          icon="lock-closed-outline"
          value={password}
          onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
          placeholder="••••••••"
          secureTextEntry={!showPass}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          onFocus={() => setPassFocused(true)}
          onBlur={() => setPassFocused(false)}
          focused={passFocused}
          error={errors.password}
          showToggle
          showValue={showPass}
          onToggleShow={() => setShowPass(v => !v)}
          accessibilityLabel="Пароль"
          accessibilityHint="Введите ваш пароль"
        />

        <View style={s.actions}>
          <AccessibleButton
            label="Кіру"
            a11yLabel="Войти"
            hint="Дважды нажмите для входа"
            onPress={handleLogin}
            loading={loading}
          />
          <AccessibleButton
            label="Аккаунт жоқ па? Тіркеліңіз"
            a11yLabel="Нет аккаунта? Зарегистрируйтесь"
            hint="Перейти к регистрации"
            onPress={() => navigation.navigate('Register')}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HERO_H = Math.max(Math.round(SCREEN_H * 0.36), 240);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },

  hero: {
    height: HERO_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  logoRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  logoImg: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  appName: {
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 3,
  },
  appSub: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },

  sheet: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
  },
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  sheetTitle: { fontWeight: '700' },
  sheetSub: {
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },

  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
