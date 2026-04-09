import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';

type Nav = StackNavigationProp<HomeStackParamList, 'Home'>;

const MENU = [
  { id: 'new', label: 'Новые поступления', icon: '✨', screen: 'NewArrivals', hint: 'Просмотр новых книг' },
  { id: 'genres', label: 'Книги по жанрам', icon: '🏷️', screen: 'Genres', hint: 'Книги по категориям' },
  { id: 'popular', label: 'Популярное', icon: '⭐', screen: 'Popular', hint: 'Популярные книги' },
  { id: 'all', label: 'Все книги по алфавиту', icon: '🔤', screen: 'AllBooks', hint: 'Весь список книг' },
  { id: 'fav', label: 'Избранные книги', icon: '❤️', screen: 'Favorites', hint: 'Ваши избранные книги' },
] as const;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();

  return (
    <ScrollView style={s.container}>
      <View accessible={true} accessibilityRole="header"
        accessibilityLabel={`АудиоКнига. ${user?.full_name ? 'Добро пожаловать, ' + user.full_name : 'Главное меню'}`}
        style={s.header}>
        <Text style={s.icon} accessible={false}>🎧</Text>
        <View accessible={false}>
          <Text style={s.appName} accessible={false}>АудиоКнига</Text>
          {user?.full_name ? <Text style={s.welcome} accessible={false}>Добро пожаловать, {user.full_name}</Text> : null}
        </View>
      </View>

      {MENU.map(item => (
        <TouchableOpacity key={item.id} style={s.menuItem}
          onPress={() => navigation.navigate(item.screen as any)}
          accessible={true} accessibilityRole="button"
          accessibilityLabel={item.label} accessibilityHint={`Дважды нажмите — ${item.hint}`}>
          <Text style={s.menuIcon} accessible={false}>{item.icon}</Text>
          <Text style={s.menuLabel} accessible={false}>{item.label}</Text>
          <Text style={s.chevron} accessible={false}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', gap: 14, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  icon: { fontSize: 44 },
  appName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  welcome: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', minHeight: 64 },
  menuIcon: { fontSize: 22, width: 36 },
  menuLabel: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' },
  chevron: { fontSize: 22, color: '#9CA3AF' },
});
