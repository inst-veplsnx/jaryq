import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import PlayerScreen from '../screens/PlayerScreen';
import { ProfileScreen, SettingsScreen } from '../screens/ProfileScreen';
import {
  NewArrivalsScreen, GenresScreen, GenreBooksScreen,
  PopularScreen, AllBooksScreen, FavoritesScreen, BookshelfScreen,
} from '../screens/ListScreens';

import {
  AuthStackParamList, MainTabParamList,
  HomeStackParamList, SearchStackParamList,
  BookshelfStackParamList, ProfileStackParamList,
} from '../types';

const Root = createStackNavigator();
const Auth = createStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const HomeS = createStackNavigator<HomeStackParamList>();
const SearchS = createStackNavigator<SearchStackParamList>();
const ShelfS = createStackNavigator<BookshelfStackParamList>();
const ProfS = createStackNavigator<ProfileStackParamList>();

const headerOpts = {
  headerStyle: { backgroundColor: '#fff' },
  headerTintColor: '#2563EB',
  headerTitleStyle: { fontWeight: '700' as const, color: '#111827' },
};

function AuthNav() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login" component={LoginScreen} />
      <Auth.Screen name="Register" component={RegisterScreen} />
    </Auth.Navigator>
  );
}

function HomeNav() {
  return (
    <HomeS.Navigator screenOptions={headerOpts}>
      <HomeS.Screen name="Home" component={HomeScreen} options={{ title: 'АудиоКнига' }} />
      <HomeS.Screen name="NewArrivals" component={NewArrivalsScreen} options={{ title: 'Новые поступления' }} />
      <HomeS.Screen name="Genres" component={GenresScreen} options={{ title: 'Жанры' }} />
      <HomeS.Screen name="GenreBooks" component={GenreBooksScreen} options={({ route }) => ({ title: route.params.genre.name })} />
      <HomeS.Screen name="Popular" component={PopularScreen} options={{ title: 'Популярное' }} />
      <HomeS.Screen name="AllBooks" component={AllBooksScreen} options={{ title: 'Все книги' }} />
      <HomeS.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Избранное' }} />
      <HomeS.Screen name="BookDetail" component={BookDetailScreen} options={({ route }) => ({ title: route.params.book.title })} />
      <HomeS.Screen name="Player" component={PlayerScreen} options={{ title: 'Воспроизведение' }} />
    </HomeS.Navigator>
  );
}

function SearchNav() {
  return (
    <SearchS.Navigator screenOptions={headerOpts}>
      <SearchS.Screen name="Search" component={SearchScreen} options={{ title: 'Поиск' }} />
      <SearchS.Screen name="BookDetail" component={BookDetailScreen} options={({ route }) => ({ title: route.params.book.title })} />
      <SearchS.Screen name="Player" component={PlayerScreen} options={{ title: 'Воспроизведение' }} />
    </SearchS.Navigator>
  );
}

function ShelfNav() {
  return (
    <ShelfS.Navigator screenOptions={headerOpts}>
      <ShelfS.Screen name="Bookshelf" component={BookshelfScreen} options={{ title: 'Книжная полка' }} />
      <ShelfS.Screen name="BookDetail" component={BookDetailScreen} options={({ route }) => ({ title: route.params.book.title })} />
      <ShelfS.Screen name="Player" component={PlayerScreen} options={{ title: 'Воспроизведение' }} />
    </ShelfS.Navigator>
  );
}

function ProfNav() {
  return (
    <ProfS.Navigator screenOptions={headerOpts}>
      <ProfS.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
      <ProfS.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
    </ProfS.Navigator>
  );
}

const TabIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
  <View style={[ts.iconWrap, focused && ts.iconActive]} accessible={false}>
    <Text style={ts.icon} accessible={false}>{icon}</Text>
  </View>
);

function MainNav() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false, tabBarStyle: ts.bar, tabBarActiveTintColor: '#2563EB', tabBarInactiveTintColor: '#9CA3AF', tabBarLabelStyle: ts.label }}>
      <Tabs.Screen name="HomeTab" component={HomeNav} options={{ title: 'Главная', tabBarAccessibilityLabel: 'Главная, вкладка 1 из 4', tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tabs.Screen name="SearchTab" component={SearchNav} options={{ title: 'Поиск', tabBarAccessibilityLabel: 'Поиск, вкладка 2 из 4', tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} /> }} />
      <Tabs.Screen name="BookshelfTab" component={ShelfNav} options={{ title: 'Полка', tabBarAccessibilityLabel: 'Книжная полка, вкладка 3 из 4', tabBarIcon: ({ focused }) => <TabIcon icon="📚" focused={focused} /> }} />
      <Tabs.Screen name="ProfileTab" component={ProfNav} options={{ title: 'Профиль', tabBarAccessibilityLabel: 'Профиль, вкладка 4 из 4', tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
    </Tabs.Navigator>
  );
}

const ts = StyleSheet.create({
  bar: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB', height: 60, paddingBottom: 8, paddingTop: 4 },
  label: { fontSize: 11, fontWeight: '600' },
  iconWrap: { width: 36, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  iconActive: { backgroundColor: '#EFF6FF' },
  icon: { fontSize: 20 },
});

export default function AppNavigator({ isAuth }: { isAuth: boolean }) {
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isAuth
          ? <Root.Screen name="Main" component={MainNav} />
          : <Root.Screen name="Auth" component={AuthNav} />}
      </Root.Navigator>
    </NavigationContainer>
  );
}
