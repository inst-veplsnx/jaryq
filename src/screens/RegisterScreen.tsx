import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import AccessibleButton from '../components/AccessibleButton';
import { announceForAccessibility } from '../utils/accessibility';

type Nav = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { signUp, loading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const pass2Ref = useRef<TextInput>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Введите имя';
    if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Неверный email';
    if (pass.length < 6) e.pass = 'Минимум 6 символов';
    if (pass !== pass2) e.pass2 = 'Пароли не совпадают';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validate()) { announceForAccessibility('Исправьте ошибки в форме'); return; }
    const result = await signUp(email.trim(), pass, name.trim());
    if (result.error) {
      const msg = result.error.includes('already') ? 'Этот email уже зарегистрирован' : result.error;
      Alert.alert('Ошибка', msg);
    } else {
      Alert.alert('Готово!', 'Проверьте почту для подтверждения, затем войдите.', [
        { text: 'Войти', onPress: () => navigation.navigate('Login') },
      ]);
    }
  };

  const field = (key: string, label: string, value: string, set: (v: string) => void, nextRef?: any, opts: any = {}) => (
    <View style={s.field}>
      <Text style={s.label} accessible={true} accessibilityRole="text">{label}</Text>
      <TextInput
        style={[s.input, errors[key] && s.inputErr]} value={value}
        onChangeText={t => { set(t); setErrors(p => ({ ...p, [key]: '' })); }}
        accessible={true} accessibilityLabel={label}
        returnKeyType={nextRef ? 'next' : 'done'}
        onSubmitEditing={() => nextRef?.current?.focus()}
        {...opts}
      />
      {errors[key] ? <Text style={s.err} accessibilityRole="alert" accessible>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View accessible={true} accessibilityRole="header" accessibilityLabel="Создание аккаунта" style={s.header}>
          <Text style={s.title} accessible={false}>Создать аккаунт</Text>
        </View>
        {field('name', 'Имя', name, setName, emailRef, { placeholder: 'Ваше имя', autoCapitalize: 'words' })}
        {field('email', 'Электронная почта', email, setEmail, passRef, { ref: emailRef, placeholder: 'example@mail.ru', keyboardType: 'email-address', autoCapitalize: 'none' })}
        {field('pass', 'Пароль', pass, setPass, pass2Ref, { ref: passRef, secureTextEntry: true, placeholder: 'Минимум 6 символов' })}
        {field('pass2', 'Повторите пароль', pass2, setPass2, undefined, { ref: pass2Ref, secureTextEntry: true, placeholder: 'Повторите пароль', onSubmitEditing: handleRegister })}
        <AccessibleButton label="Зарегистрироваться" hint="Дважды нажмите для создания аккаунта" onPress={handleRegister} loading={loading} style={s.btn} />
        <AccessibleButton label="Уже есть аккаунт? Войти" hint="Перейти на экран входа" onPress={() => navigation.navigate('Login')} variant="ghost" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flexGrow: 1, padding: 24 },
  header: { marginTop: 16, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 7 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827', minHeight: 52 },
  inputErr: { borderColor: '#DC2626' },
  err: { fontSize: 13, color: '#DC2626', marginTop: 5 },
  btn: { marginTop: 8, marginBottom: 12 },
});
