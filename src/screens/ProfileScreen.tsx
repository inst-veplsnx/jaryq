import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import AccessibleButton from '../components/AccessibleButton';

type Nav = StackNavigationProp<ProfileStackParamList, 'Profile'>;

const MenuItem = ({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: string;
  label: string;
  hint: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={s.menuItem}
    onPress={onPress}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={hint}
  >
    <Text style={s.menuIcon} accessible={false}>{icon}</Text>
    <Text style={s.menuLabel} accessible={false}>{label}</Text>
    <Text style={s.chevron} accessible={false}>›</Text>
  </TouchableOpacity>
);

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { user, signOut } = useAuthStore();

  const handleSignOut = () =>
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: signOut },
    ]);

  return (
    <ScrollView style={s.container}>
      <View
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={`Профиль: ${user?.full_name || user?.email || 'Пользователь'}`}
        style={s.profileSection}
      >
        <View style={s.avatar} accessible={false}>
          <Text style={s.avatarTxt} accessible={false}>
            {(user?.full_name || user?.email || 'A')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={s.name} accessible={false}>
          {user?.full_name || 'Пользователь'}
        </Text>
        <Text style={s.email} accessible={false}>{user?.email}</Text>
      </View>

      <View style={s.menu}>
        <MenuItem
          icon="⚙️"
          label="Настройки"
          hint="Открыть настройки приложения"
          onPress={() => nav.navigate('Settings')}
        />
        <MenuItem
          icon="ℹ️"
          label="О приложении"
          hint="Информация о приложении"
          onPress={() =>
            Alert.alert(
              'АудиоКнига v1.0',
              'Аудиобиблиотека с поддержкой Samsung TalkBack',
            )
          }
        />
        <MenuItem
          icon="❓"
          label="Справка по TalkBack"
          hint="Инструкция по управлению"
          onPress={() =>
            Alert.alert(
              'Управление TalkBack',
              '• Одно касание — фокус и озвучивание\n• Двойное нажатие — активация\n• Свайп влево/вправо — переход между элементами\n• Слайдер перемотки: свайп вверх/вниз',
            )
          }
        />
      </View>

      <View style={s.signOutWrap}>
        <AccessibleButton
          label="Выйти из аккаунта"
          hint="Дважды нажмите для выхода"
          onPress={handleSignOut}
          variant="danger"
        />
      </View>
    </ScrollView>
  );
}

export function SettingsScreen() {
  const [keepOn, setKeepOn] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const Row = ({
    label,
    desc,
    value,
    onToggle,
  }: {
    label: string;
    desc: string;
    value: boolean;
    onToggle: (v: boolean) => void;
  }) => (
    <View style={s.settingRow}>
      <View style={s.settingInfo} accessible={false}>
        <Text style={s.settingLabel} accessible={false}>{label}</Text>
        <Text style={s.settingDesc} accessible={false}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
        thumbColor="#fff"
        accessible={true}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityHint={`${desc}. Сейчас: ${value ? 'включено' : 'выключено'}`}
        accessibilityState={{ checked: value }}
      />
    </View>
  );

  return (
    <ScrollView style={s.container}>
      <View
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="Настройки"
        style={s.settingsHeader}
      >
        <Text style={s.settingsTitle} accessible={false}>Настройки</Text>
      </View>
      <View style={s.section}>
        <Text
          style={s.sectionTitle}
          accessible={true}
          accessibilityRole="header"
        >
          Воспроизведение
        </Text>
        <Row
          label="Экран не гаснет"
          desc="Держит экран включённым при прослушивании"
          value={keepOn}
          onToggle={setKeepOn}
        />
        <Row
          label="Автосохранение"
          desc="Сохранять позицию каждые 10 секунд"
          value={autoSave}
          onToggle={setAutoSave}
        />
      </View>
      <Text
        style={s.version}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Версия 1.0.0"
      >
        Версия 1.0.0
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarTxt: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280' },
  menu: { backgroundColor: '#fff', marginBottom: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    minHeight: 60,
  },
  menuIcon: { fontSize: 22, width: 36 },
  menuLabel: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' },
  chevron: { fontSize: 22, color: '#9CA3AF' },
  signOutWrap: { paddingHorizontal: 16 },
  settingsHeader: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  settingsTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  section: { backgroundColor: '#fff', marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    minHeight: 64,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
  settingDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#D1D5DB',
    padding: 24,
  },
});