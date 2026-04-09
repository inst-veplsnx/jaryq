import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';

const SettingsScreen: React.FC = () => {
  const [keepScreenOn, setKeepScreenOn] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const SettingRow: React.FC<{
    label: string;
    description: string;
    value: boolean;
    onToggle: (v: boolean) => void;
  }> = ({ label, description, value, onToggle }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo} accessible={false}>
        <Text style={styles.settingLabel} accessible={false}>{label}</Text>
        <Text style={styles.settingDesc} accessible={false}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
        thumbColor="#fff"
        accessible={true}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityHint={`${description}. Сейчас: ${value ? 'включено' : 'выключено'}`}
        accessibilityState={{ checked: value }}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="Настройки приложения"
        style={styles.header}
      >
        <Text style={styles.headerTitle} accessible={false}>Настройки</Text>
      </View>

      {/* Раздел: Воспроизведение */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Воспроизведение"
        >
          Воспроизведение
        </Text>
        <SettingRow
          label="Экран не гаснет"
          description="Держит экран включённым во время прослушивания"
          value={keepScreenOn}
          onToggle={setKeepScreenOn}
        />
        <SettingRow
          label="Автосохранение прогресса"
          description="Сохранять место каждые 10 секунд"
          value={autoSave}
          onToggle={setAutoSave}
        />
      </View>

      {/* Раздел: Доступность */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Доступность"
        >
          Доступность
        </Text>
        <SettingRow
          label="Крупный текст"
          description="Увеличивает размер шрифта в приложении"
          value={largeText}
          onToggle={setLargeText}
        />
        <SettingRow
          label="Высокий контраст"
          description="Улучшает видимость элементов интерфейса"
          value={highContrast}
          onToggle={setHighContrast}
        />
      </View>

      {/* Раздел: Данные */}
      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
          accessible={true}
          accessibilityRole="header"
        >
          Данные
        </Text>
        <TouchableOpacity
          style={styles.dangerRow}
          onPress={() =>
            Alert.alert(
              'Очистить прогресс',
              'Весь сохранённый прогресс прослушивания будет удалён. Продолжить?',
              [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: () => {} },
              ],
            )
          }
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Очистить весь прогресс"
          accessibilityHint="Дважды нажмите для удаления всего прогресса прослушивания"
        >
          <Text style={styles.dangerText} accessible={false}>🗑 Очистить весь прогресс</Text>
        </TouchableOpacity>
      </View>

      <Text
        style={styles.version}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Версия приложения 1.0.0"
      >
        Версия 1.0.0
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 0,
  },
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
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    minHeight: 56,
    justifyContent: 'center',
  },
  dangerText: { fontSize: 15, color: '#DC2626', fontWeight: '500' },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#D1D5DB',
    padding: 24,
  },
});

export default SettingsScreen;
