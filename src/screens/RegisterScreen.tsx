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
type Nav = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { signUp, loading } = useAuthStore();
  const { t, c } = useAppScale();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [pass2Focused, setPass2Focused] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const pass2Ref = useRef<TextInput>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Атыңызды енгізіңіз';
    else if (name.trim().length < 2) e.name = 'Атыңыз тым қысқа';
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    const passErr = validatePassword(pass);
    if (passErr) e.pass = passErr;
    if (!pass2) e.pass2 = 'Құпия сөзді қайталаңыз';
    else if (pass !== pass2) e.pass2 = 'Құпия сөздер сәйкес келмейді';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validate()) { announceForAccessibility('Исправьте ошибки в форме'); return; }
    try {
      const result = await signUp(email.trim(), pass, name.trim());
      if (result.error) {
        const msg = result.error.includes('already') ? 'Бұл email бұрыннан тіркелген' : result.error;
        Alert.alert('Қате', msg);
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
      {/* Шапка */}
      <View
        style={s.hero}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="JARYQ. Создание аккаунта."
      >
        <View style={s.logoRing} accessible={false}>
          <Image source={require('../../assets/icon.png')} style={s.logoImg} />
        </View>
        <Text style={[s.heroTitle, { fontSize: t.xxl }]} accessible={false}>Тіркелу</Text>
        <Text style={[s.heroSub, { fontSize: t.sm }]} accessible={false}>Аккаунт жасаңыз</Text>
      </View>

      {/* Форма */}
      <ScrollView
        style={s.sheet}
        contentContainerStyle={s.sheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <FormInput
          label="Сіздің атыңыз"
          icon="person-outline"
          value={name}
          onChangeText={(v) => { setName(v); setErrors(p => ({ ...p, name: '' })); }}
          placeholder="Айгүл Ахметова"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          focused={nameFocused}
          error={errors.name}
          accessibilityLabel="Ваше имя"
        />

        <FormInput
          ref={emailRef}
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
        />

        <FormInput
          ref={passRef}
          label="Құпия сөз"
          icon="lock-closed-outline"
          value={pass}
          onChangeText={(v) => { setPass(v); setErrors(p => ({ ...p, pass: '' })); }}
          placeholder="Кемінде 6 таңба"
          secureTextEntry={!showPass}
          returnKeyType="next"
          onSubmitEditing={() => pass2Ref.current?.focus()}
          onFocus={() => setPassFocused(true)}
          onBlur={() => setPassFocused(false)}
          focused={passFocused}
          error={errors.pass}
          showToggle
          showValue={showPass}
          onToggleShow={() => setShowPass(v => !v)}
          accessibilityLabel="Пароль"
        />

        <FormInput
          ref={pass2Ref}
          label="Құпия сөзді қайталаңыз"
          icon="shield-checkmark-outline"
          value={pass2}
          onChangeText={(v) => { setPass2(v); setErrors(p => ({ ...p, pass2: '' })); }}
          placeholder="Құпия сөзді қайталаңыз"
          secureTextEntry={!showConfirmPass}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
          onFocus={() => setPass2Focused(true)}
          onBlur={() => setPass2Focused(false)}
          focused={pass2Focused}
          error={errors.pass2}
          showToggle
          showValue={showConfirmPass}
          onToggleShow={() => setShowConfirmPass(v => !v)}
          accessibilityLabel="Повторите пароль"
        />

        <View style={s.actions}>
          <AccessibleButton
            label="Тіркелу"
            a11yLabel="Зарегистрироваться"
            hint="Дважды нажмите для создания аккаунта"
            onPress={handleRegister}
            loading={loading}
          />
          <AccessibleButton
            label="Аккаунт бар ма? Кіріңіз"
            a11yLabel="Уже есть аккаунт? Войти"
            hint="Перейти на экран входа"
            onPress={() => navigation.navigate('Login')}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HERO_H = Math.max(Math.round(SCREEN_H * 0.28), 200);

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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  logoImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  heroTitle: {
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },

  sheet: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
  },
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },

  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
