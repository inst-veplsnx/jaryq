import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '../components/Icon';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Navigation error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.container}>
          <Text style={eb.text}>Қате орын алды. Қолданбаны қайта іске қосыңыз.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

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
} from '../screens/lists';

import {
  AuthStackParamList, MainTabParamList,
  HomeStackParamList, SearchStackParamList,
  BookshelfStackParamList, ProfileStackParamList,
} from '../types';
import { colors, typography } from '../theme/designTokens';

const Root = createStackNavigator();
const Auth = createStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const HomeS = createStackNavigator<HomeStackParamList>();
const SearchS = createStackNavigator<SearchStackParamList>();
const ShelfS = createStackNavigator<BookshelfStackParamList>();
const ProfS = createStackNavigator<ProfileStackParamList>();

const headerOpts = {
  headerStyle: {
    backgroundColor: colors.bgCard,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  } as any,
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: '700' as const,
    color: colors.textPrimary,
    fontSize: typography.lg,
  },
  headerBackTitleVisible: false,
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
      <HomeS.Screen name="Home" component={HomeScreen} options={{ title: 'JARYQ' }} />
      <HomeS.Screen name="NewArrivals" component={NewArrivalsScreen} options={{ title: 'Жаңа кітаптар' }} />
      <HomeS.Screen name="Genres" component={GenresScreen} options={{ title: 'Жанрлар' }} />
      <HomeS.Screen name="GenreBooks" component={GenreBooksScreen} options={({ route }) => ({ title: route.params.genre.name })} />
      <HomeS.Screen name="Popular" component={PopularScreen} options={{ title: 'Танымал' }} />
      <HomeS.Screen name="AllBooks" component={AllBooksScreen} options={{ title: 'Барлық кітаптар' }} />
      <HomeS.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Таңдаулы' }} />
      <HomeS.Screen name="BookDetail" component={BookDetailScreen} options={({ route }) => ({ title: route.params.book.title })} />
      <HomeS.Screen name="Player" component={PlayerScreen} options={{ title: 'Ойнату' }} />
    </HomeS.Navigator>
  );
}

function SearchNav() {
  return (
    <SearchS.Navigator screenOptions={headerOpts}>
      <SearchS.Screen name="Search" component={SearchScreen} options={{ title: 'Іздеу' }} />
      <SearchS.Screen name="BookDetail" component={BookDetailScreen} options={({ route }) => ({ title: route.params.book.title })} />
      <SearchS.Screen name="Player" component={PlayerScreen} options={{ title: 'Ойнату' }} />
    </SearchS.Navigator>
  );
}

function ShelfNav() {
  return (
    <ShelfS.Navigator screenOptions={headerOpts}>
      <ShelfS.Screen name="Bookshelf" component={BookshelfScreen} options={{ title: 'Кітап сөресі' }} />
      <ShelfS.Screen name="BookDetail" component={BookDetailScreen} options={({ route }) => ({ title: route.params.book.title })} />
      <ShelfS.Screen name="Player" component={PlayerScreen} options={{ title: 'Ойнату' }} />
    </ShelfS.Navigator>
  );
}

function ProfNav() {
  return (
    <ProfS.Navigator screenOptions={headerOpts}>
      <ProfS.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
      <ProfS.Screen name="Settings" component={SettingsScreen} options={{ title: 'Параметрлер' }} />
    </ProfS.Navigator>
  );
}

function MainNav() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: ts.bar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: ts.label,
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeNav}
        options={{
          title: 'Басты',
          tabBarAccessibilityLabel: 'Главная, вкладка 1 из 4',
          tabBarIcon: ({ focused, color }) => (
            <View style={[ts.iconWrap, focused && ts.iconActive]}>
              <Icon name={focused ? 'home' : 'home-outline'} size={23} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="SearchTab"
        component={SearchNav}
        options={{
          title: 'Іздеу',
          tabBarAccessibilityLabel: 'Поиск, вкладка 2 из 4',
          tabBarIcon: ({ focused, color }) => (
            <View style={[ts.iconWrap, focused && ts.iconActive]}>
              <Icon name={focused ? 'search' : 'search-outline'} size={23} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="BookshelfTab"
        component={ShelfNav}
        options={{
          title: 'Сөре',
          tabBarAccessibilityLabel: 'Книжная полка, вкладка 3 из 4',
          tabBarIcon: ({ focused, color }) => (
            <View style={[ts.iconWrap, focused && ts.iconActive]}>
              <Icon name={focused ? 'library' : 'library-outline'} size={23} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfNav}
        options={{
          title: 'Профиль',
          tabBarAccessibilityLabel: 'Профиль, вкладка 4 из 4',
          tabBarIcon: ({ focused, color }) => (
            <View style={[ts.iconWrap, focused && ts.iconActive]}>
              <Icon name={focused ? 'person' : 'person-outline'} size={23} color={color} />
            </View>
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

const eb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 16, color: '#333', textAlign: 'center' },
});

const ts = StyleSheet.create({
  bar: {
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 16,
    shadowColor: colors.shadowMd,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
    borderRadius: 16,
  },
  iconActive: { backgroundColor: colors.primarySoft },
});

export default function AppNavigator({ isAuth }: { isAuth: boolean }) {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Root.Navigator screenOptions={{ headerShown: false }}>
          {isAuth
            ? <Root.Screen name="Main" component={MainNav} />
            : <Root.Screen name="Auth" component={AuthNav} />}
        </Root.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
