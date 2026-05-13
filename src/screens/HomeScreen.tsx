import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { colors, radii, spacing, a11y, interaction } from '../theme/designTokens';
import { useAppScale } from '../theme/useAppScale';
import Icon, { IconName } from '../components/Icon';

type Nav = StackNavigationProp<HomeStackParamList, 'Home'>;

const MENU: {
  id: string;
  label: string;
  a11yLabel: string;
  sub: string;
  icon: IconName;
  screen: string;
  hint: string;
  accent: string;
  bg: string;
}[] = [
  { id: 'new',    label: 'Жаңа кітаптар',     a11yLabel: 'Новые книги',     sub: 'Жаңа аудиокітаптар',    icon: 'sparkles', screen: 'NewArrivals', hint: 'Просмотр новых книг',    accent: colors.primary,       bg: colors.primarySoft       },
  { id: 'genres', label: 'Жанрлар',           a11yLabel: 'Жанры',           sub: 'Барлық санаттар',        icon: 'albums',   screen: 'Genres',     hint: 'Книги по категориям',  accent: colors.accentBlue,    bg: colors.accentBlueSoft    },
  { id: 'popular',label: 'Танымал',           a11yLabel: 'Популярное',      sub: 'Тыңдаушылар топ-тізімі', icon: 'flame',    screen: 'Popular',    hint: 'Популярные книги',     accent: colors.accentRed,     bg: colors.accentRedSoft     },
  { id: 'all',    label: 'Барлық кітаптар',   a11yLabel: 'Все книги',       sub: 'Алфавит бойынша',        icon: 'book',     screen: 'AllBooks',   hint: 'Весь список книг',     accent: colors.accentPurple,  bg: colors.accentPurpleSoft  },
  { id: 'fav',    label: 'Таңдаулы',          a11yLabel: 'Избранное',       sub: 'Сіздің тізіміңіз',       icon: 'heart',    screen: 'Favorites',  hint: 'Ваши избранные книги', accent: colors.accentPink,    bg: colors.accentPinkSoft    },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { t, c } = useAppScale();

  const firstName = user?.full_name?.split(' ')[0] || null;

  return (
    <ScrollView
      style={[s.container, { backgroundColor: c.bgMain }]}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Шапка */}
      <View
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={`JARYQ. ${firstName ? 'Добро пожаловать, ' + firstName : 'Главное меню'}`}
        style={[s.header, { backgroundColor: c.bgCard }]}
      >
        <View style={s.headerInner}>
          <View style={s.headerText}>
            <Text style={[s.greeting, { fontSize: t.sm, color: c.textMuted }]} accessible={false}>
              {firstName ? 'Қош келдіңіз,' : 'Дыбыстық кітапхана'}
            </Text>
            <Text style={[s.userName, { fontSize: t.xxl, color: c.textPrimary }]} accessible={false}>
              {firstName ?? 'JARYQ'}
            </Text>
          </View>

          <View style={[s.avatarWrap, { backgroundColor: c.bgMain }]} accessible={false}>
            <Image source={require('../../assets/icon.png')} style={s.avatarImg} />
          </View>
        </View>

        <View style={s.tagLine} accessible={false}>
          <Icon name="musical-notes" size={15} color={colors.primaryLight} />
          <Text style={[s.tagText, { fontSize: t.xs, color: c.textMuted }]} accessible={false}>
            Кез келген уақытта кітап тыңдаңыз
          </Text>
        </View>
      </View>

      {/* Меню */}
      <View style={s.menuSection}>
        <Text
          style={[s.sectionTitle, { fontSize: t.xs, color: c.textMuted }]}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Разделы"
        >
          Бөлімдер
        </Text>

        {MENU.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[s.menuCard, { backgroundColor: c.bgCard }, idx === MENU.length - 1 && { marginBottom: 0 }]}
            onPress={() => navigation.navigate(item.screen as any)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={item.a11yLabel}
            accessibilityHint={`Дважды нажмите — ${item.hint}`}
            activeOpacity={interaction.activeOpacity}
          >
            <View style={[s.iconCircle, { backgroundColor: item.bg }]} accessible={false}>
              <Icon name={item.icon} size={28} color={item.accent} />
            </View>

            <View style={s.cardText} accessible={false}>
              <Text style={[s.cardLabel, { fontSize: t.lg, color: c.textPrimary }]} accessible={false}>
                {item.label}
              </Text>
              <Text style={[s.cardSub, { fontSize: t.sm, color: c.textMuted }]} accessible={false}>
                {item.sub}
              </Text>
            </View>

            <View style={s.chevronWrap} accessible={false}>
              <Icon name="chevron-forward" size={22} color={colors.borderLight} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    marginBottom: spacing.md,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerText: { flex: 1 },
  greeting: { fontWeight: '500', marginBottom: 2 },
  userName: { fontWeight: '800', letterSpacing: -0.5 },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  tagLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tagText: { fontWeight: '500' },

  menuSection: { paddingHorizontal: spacing.md },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minHeight: a11y.minTouchTarget + 8,
    shadowColor: colors.shadowSm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  cardText: { flex: 1 },
  cardLabel: { fontWeight: '600', marginBottom: 2 },
  cardSub: { fontWeight: '400' },
  chevronWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
