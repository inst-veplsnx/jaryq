import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDownloadStore } from '../store/downloadStore';
import { bookService } from '../services/bookService';
import { formatFileSize } from '../services/downloadService';
import AccessibleButton from '../components/AccessibleButton';
import Icon, { IconName } from '../components/Icon';
import { colors, typography, radii, spacing, a11y } from '../theme/designTokens';
import { useAppScale } from '../theme/useAppScale';

type Nav = StackNavigationProp<ProfileStackParamList, 'Profile'>;

const MenuItem = ({
  icon,
  label,
  a11yLabel,
  hint,
  onPress,
  destructive,
}: {
  icon: IconName;
  label: string;
  a11yLabel?: string;
  hint: string;
  onPress: () => void;
  destructive?: boolean;
}) => (
  <TouchableOpacity
    style={s.menuItem}
    onPress={onPress}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={a11yLabel ?? label}
    accessibilityHint={hint}
    activeOpacity={0.7}
  >
    <View style={[s.menuIconWrap, destructive && s.menuIconWrapDanger]} accessible={false}>
      <Icon name={icon} size={20} color={destructive ? colors.error : colors.primary} />
    </View>
    <Text style={[s.menuLabel, destructive && s.menuLabelDanger]} accessible={false} numberOfLines={1}>{label}</Text>
    <Icon name="chevron-forward" size={18} color={colors.borderLight} />
  </TouchableOpacity>
);

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { user, signOut } = useAuthStore();
  const { t, c } = useAppScale();

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = () =>
    Alert.alert('Шығу', 'Шыққыңыз келетінін растайсыз ба?', [
      { text: 'Бас тарту', style: 'cancel' },
      { text: 'Шығу', style: 'destructive', onPress: signOut },
    ]);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Профиль-карточка */}
      <View
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={`Профиль: ${user?.full_name || user?.email || 'Пользователь'}`}
        style={s.profileCard}
      >
        <View style={s.avatarRing} accessible={false}>
          <View style={s.avatar} accessible={false}>
            <Text style={s.avatarTxt} accessible={false}>{initials}</Text>
          </View>
        </View>
        <Text style={[s.name, { fontSize: t.xxl, color: c.textPrimary }]} accessible={false}>{user?.full_name || 'Пайдаланушы'}</Text>
        <Text style={[s.email, { fontSize: t.sm, color: c.textMuted }]} accessible={false}>{user?.email}</Text>
      </View>

      {/* Меню */}
      <View style={s.section}>
        <Text style={s.sectionTitle} accessible={false}>Қолданба</Text>
        <MenuItem
          icon="settings-outline"
          label="Баптаулар"
          a11yLabel="Настройки"
          hint="Открыть настройки приложения"
          onPress={() => nav.navigate('Settings')}
        />
        <MenuItem
          icon="information-circle-outline"
          label="Приложение туралы"
          a11yLabel="О приложении"
          hint="Информация о приложении JARYQ"
          onPress={() => Alert.alert('JARYQ v1.0', 'Samsung TalkBack қолдауы бар дыбыстық кітапхана')}
        />
        <MenuItem
          icon="accessibility-outline"
          label="TalkBack анықтамасы"
          a11yLabel="Справка по TalkBack"
          hint="Инструкция по управлению через TalkBack"
          onPress={() =>
            Alert.alert(
              'TalkBack басқару',
              '• Бір рет басу — фокус және дыбыстау\n• Екі рет басу — белсендіру\n• Солға/оңға сырғыту — элементтер арасында өту\n• Айналдыру сырғытпасы: жоғары/төмен сырғыту',
            )
          }
        />
      </View>

      <Text
        style={s.version}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Версия 1.0.0"
      >
        JARYQ v1.0.0
      </Text>

      {/* Выйти — всегда в самом низу */}
      <View style={s.signOutSection}>
        <AccessibleButton
          label="Аккаунттан шығу"
          a11yLabel="Выйти из аккаунта"
          hint="Дважды нажмите для выхода"
          onPress={handleSignOut}
          variant="danger"
        />
      </View>
    </ScrollView>
  );
}

const SettingRow = React.memo(({
  label,
  a11yLabel,
  desc,
  descRu,
  value,
  onToggle,
  icon,
}: {
  label: string;
  a11yLabel?: string;
  desc: string;
  descRu?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  icon: IconName;
}) => {
  const { t, c } = useAppScale();
  return (
    <View style={[s.settingRow, { borderTopColor: c.borderSoft }]}>
      <View style={[s.settingIconWrap, { backgroundColor: c.bgMain }]} accessible={false}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={s.settingInfo} accessible={false}>
        <Text style={[s.settingLabel, { fontSize: t.md, color: c.textPrimary }]} accessible={false}>{label}</Text>
        <Text style={[s.settingDesc, { fontSize: t.xs, color: c.textMuted }]} accessible={false}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: c.borderSoft, true: colors.primary }}
        thumbColor="#fff"
        accessible={true}
        accessibilityRole="switch"
        accessibilityLabel={a11yLabel ?? label}
        accessibilityHint={`${descRu ?? desc}. Сейчас: ${value ? 'включено' : 'выключено'}`}
        accessibilityState={{ checked: value }}
      />
    </View>
  );
});

export function SettingsScreen() {
  const { user } = useAuthStore();
  const {
    keepScreenOn, autoSave, largeText, highContrast,
    loadSettings, setKeepScreenOn, setAutoSave, setLargeText, setHighContrast,
  } = useSettingsStore();
  const { downloadedBooks, downloadsSize, deleteAllDownloads, initialize } = useDownloadStore();
  const { t, c } = useAppScale();

  useEffect(() => {
    loadSettings();
    initialize();
  }, []);

  const handleClearProgress = () => {
    if (!user) return;
    Alert.alert(
      'Үлгерімді тазалау',
      'Барлық сақталған тыңдау үлгерімі жойылады. Жалғастыру?',
      [
        { text: 'Бас тарту', style: 'cancel' },
        {
          text: 'Жою',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookService.clearAllProgress(user.id);
              Alert.alert('Дайын', 'Үлгерім сәтті тазаланды');
            } catch {
              Alert.alert('Қате', 'Үлгерімді тазалау сәтсіз аяқталды. Қайталап көріңіз.');
            }
          },
        },
      ],
    );
  };

  const handleDeleteAllDownloads = () => {
    Alert.alert(
      'Барлық жүктеулерді жою',
      `Барлық жүктелген кітаптар (${downloadedBooks.length}, ${formatFileSize(downloadsSize)}) жойылады. Жалғастыру?`,
      [
        { text: 'Бас тарту', style: 'cancel' },
        {
          text: 'Жою',
          style: 'destructive',
          onPress: async () => {
            await deleteAllDownloads();
            Alert.alert('Дайын', 'Барлық жүктеулер жойылды');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* Воспроизведение */}
      <View style={[s.settingsSection, { backgroundColor: c.bgCard }]}>
        <Text style={[s.sectionTitle, { color: c.textMuted }]} accessible={true} accessibilityRole="header">
          Ойнату
        </Text>
        <SettingRow
          icon="phone-portrait-outline"
          label="Экран сөнбейді"
          a11yLabel="Экран не гаснет"
          desc="Тыңдау кезінде экранды қосулы ұстайды"
          descRu="Держит экран включённым при прослушивании"
          value={keepScreenOn}
          onToggle={setKeepScreenOn}
        />
        <SettingRow
          icon="save-outline"
          label="Автосақтау"
          a11yLabel="Автосохранение"
          desc="Тыңдау кезіндегі позицияны әр 10 секунд сайын сақтау"
          descRu="Сохранять позицию каждые 10 секунд"
          value={autoSave}
          onToggle={setAutoSave}
        />
      </View>

      {/* Доступность */}
      <View style={[s.settingsSection, { backgroundColor: c.bgCard }]}>
        <Text style={[s.sectionTitle, { color: c.textMuted }]} accessible={true} accessibilityRole="header">
          Қолжетімділік
        </Text>
        <SettingRow
          icon="text-outline"
          label="Үлкен мәтін"
          a11yLabel="Крупный текст"
          desc="Мәтін өлшемін үлкейтеді"
          descRu="Увеличивает размер шрифта в приложении"
          value={largeText}
          onToggle={setLargeText}
        />
        <SettingRow
          icon="contrast-outline"
          label="Жоғары контраст"
          a11yLabel="Высокий контраст"
          desc="Интерфейс элементтерінің көрінуін жақсартады"
          descRu="Улучшает видимость элементов интерфейса"
          value={highContrast}
          onToggle={setHighContrast}
        />
      </View>

      {/* Офлайн загрузки */}
      <View style={[s.settingsSection, { backgroundColor: c.bgCard }]}>
        <Text
          style={[s.sectionTitle, { color: c.textMuted }]}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel={`Офлайн загрузки, ${downloadedBooks.length} книг, ${formatFileSize(downloadsSize)}`}
        >
          Офлайн жүктеулер
        </Text>

        <View style={s.dlInfoRow} accessible={false}>
          <View style={s.dlInfoItem} accessible={false}>
            <Icon name="library-outline" size={18} color={c.textMuted} />
            <Text style={[s.dlInfoTxt, { fontSize: t.md, color: c.textSecondary }]} accessible={false}> {downloadedBooks.length} кітап</Text>
          </View>
          <View style={s.dlInfoItem} accessible={false}>
            <Icon name="server-outline" size={18} color={c.textMuted} />
            <Text style={[s.dlInfoTxt, { fontSize: t.md, color: c.textSecondary }]} accessible={false}> {formatFileSize(downloadsSize)}</Text>
          </View>
        </View>

        {downloadedBooks.length > 0 ? (
          <TouchableOpacity
            style={s.dangerRow}
            onPress={handleDeleteAllDownloads}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Удалить все загрузки, ${downloadedBooks.length} книг, ${formatFileSize(downloadsSize)}`}
            accessibilityHint="Дважды нажмите для удаления всех загруженных книг"
            activeOpacity={0.7}
          >
            <View style={s.dangerIconWrap} accessible={false}>
              <Icon name="cloud-offline-outline" size={20} color={colors.error} />
            </View>
            <Text style={[s.dangerText, { fontSize: t.md }]} accessible={false}>Барлық жүктеулерді жою</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.emptyDl} accessible={true} accessibilityLabel="Нет загруженных книг">
            <Icon name="cloud-download-outline" size={16} color={c.textMuted} />
            <Text style={[s.emptyDlTxt, { fontSize: t.sm, color: c.textMuted }]} accessible={false}>
              {' '}Жүктелген кітаптар жоқ
            </Text>
          </View>
        )}
      </View>

      {/* Данные — всегда в самом низу */}
      <View style={[s.settingsSection, { backgroundColor: c.bgCard }]}>
        <Text style={[s.sectionTitle, { color: c.textMuted }]} accessible={true} accessibilityRole="header">
          Деректер
        </Text>
        <TouchableOpacity
          style={s.dangerRow}
          onPress={handleClearProgress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Очистить весь прогресс"
          accessibilityHint="Дважды нажмите для удаления всего прогресса прослушивания"
          activeOpacity={0.7}
        >
          <View style={s.dangerIconWrap} accessible={false}>
            <Icon name="trash-outline" size={20} color={colors.error} />
          </View>
          <Text style={[s.dangerText, { fontSize: t.md }]} accessible={false}>Тыңдалынған аудиокітаптар туралы деректерді тазалау</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },

  // Профиль-карточка
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.shadowOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: typography.xxxl, fontWeight: typography.bold, color: '#fff' },
  name: { fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary, marginBottom: 4 },
  email: { fontSize: typography.sm, color: colors.textMuted },

  // Секции меню
  section: {
    backgroundColor: colors.bgCard,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    minHeight: a11y.minTouchTarget,
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapDanger: { backgroundColor: colors.errorSoft },
  menuLabel: { flex: 1, fontSize: typography.lg, color: colors.textPrimary, fontWeight: typography.medium },
  menuLabelDanger: { color: colors.error },

  signOutSection: { margin: spacing.lg },
  version: {
    textAlign: 'center',
    fontSize: typography.sm,
    color: colors.textPlaceholder,
    paddingVertical: spacing.xl,
  },

  // Настройки
  settingsSection: { backgroundColor: colors.bgCard, marginTop: spacing.xs, paddingTop: spacing.md },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    minHeight: a11y.minTouchTarget,
    gap: spacing.md,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: typography.md, fontWeight: typography.medium, color: colors.textPrimary },
  settingDesc: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    minHeight: a11y.minTouchTarget,
    gap: spacing.md,
  },
  dangerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: { fontSize: typography.md, color: colors.error, fontWeight: typography.medium, flex: 1 },
  dlInfoRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  dlInfoItem: { flexDirection: 'row', alignItems: 'center' },
  dlInfoTxt: { fontSize: typography.md, color: colors.textSecondary, fontWeight: typography.medium },
  emptyDl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  emptyDlTxt: { fontSize: typography.sm, color: colors.textMuted },
});
