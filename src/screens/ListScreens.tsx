import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  HomeStackParamList,
  Book,
  Genre,
  Favorite,
  UserProgress,
} from '../types';
import { bookService } from '../services/bookService';
import { useAuthStore } from '../store/authStore';
import BookListItem from '../components/BookListItem';
import { announceForAccessibility } from '../utils/accessibility';

type HomeNav = StackNavigationProp<HomeStackParamList>;

const Loading = () => (
  <View style={s.center}>
    <ActivityIndicator
      size="large"
      color="#2563EB"
      accessibilityLabel="Загрузка..."
    />
  </View>
);

const Empty = ({ text }: { text: string }) => (
  <Text style={s.empty} accessible={true} accessibilityRole="text">
    {text}
  </Text>
);

const Header = ({
  label,
  title,
  sub,
}: {
  label: string;
  title: string;
  sub?: string;
}) => (
  <View
    accessible={true}
    accessibilityRole="header"
    accessibilityLabel={label}
    style={s.header}
  >
    <Text style={s.title} accessible={false}>{title}</Text>
    {sub ? <Text style={s.sub} accessible={false}>{sub}</Text> : null}
  </View>
);

// ── NewArrivals ────────────────────────────────────────────────────
export function NewArrivalsScreen() {
  const nav = useNavigation<HomeNav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService
      .getNewArrivals()
      .then((d) => {
        setBooks(d);
        announceForAccessibility(`${d.length} новых книг`);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return (
    <FlatList
      style={s.list}
      data={books}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <BookListItem
          book={item}
          onPress={(b) => nav.navigate('BookDetail', { book: b })}
        />
      )}
      ListHeaderComponent={
        <Header
          label={`Новые поступления, ${books.length} книг`}
          title={`Новые поступления (${books.length})`}
        />
      }
      ListEmptyComponent={<Empty text="Нет новых поступлений" />}
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );
}

// ── Genres ──────────────────────────────────────────────────────────
export function GenresScreen() {
  const nav = useNavigation<HomeNav>();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService
      .getGenres()
      .then((d) => { setGenres(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return (
    <FlatList
      style={s.list}
      data={genres}
      keyExtractor={(i) => i.id}
      numColumns={2}
      columnWrapperStyle={s.row}
      ListHeaderComponent={
        <Header label={`Жанры, ${genres.length}`} title="Книги по жанрам" />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={s.genreCard}
          onPress={() => nav.navigate('GenreBooks', { genre: item })}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Жанр ${item.name}`}
          accessibilityHint="Дважды нажмите для просмотра книг"
        >
          <Text style={s.genreIcon} accessible={false}>{item.icon || '📚'}</Text>
          <Text style={s.genreName} accessible={false}>{item.name}</Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );
}

// ── GenreBooks ───────────────────────────────────────────────────────
export function GenreBooksScreen() {
  const nav = useNavigation<HomeNav>();
  const { params } = useRoute<RouteProp<HomeStackParamList, 'GenreBooks'>>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService
      .getBooksByGenre(params.genre.id)
      .then((d) => { setBooks(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return (
    <FlatList
      style={s.list}
      data={books}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <BookListItem
          book={item}
          onPress={(b) => nav.navigate('BookDetail', { book: b })}
        />
      )}
      ListHeaderComponent={
        <Header
          label={`${params.genre.name}, ${books.length} книг`}
          title={params.genre.name}
          sub={`${books.length} книг`}
        />
      }
      ListEmptyComponent={<Empty text="В этом жанре нет книг" />}
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );
}

// ── Popular ──────────────────────────────────────────────────────────
export function PopularScreen() {
  const nav = useNavigation<HomeNav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService
      .getPopular()
      .then((d) => { setBooks(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return (
    <FlatList
      style={s.list}
      data={books}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <BookListItem
          book={item}
          onPress={(b) => nav.navigate('BookDetail', { book: b })}
        />
      )}
      ListHeaderComponent={
        <Header
          label={`Популярное, ${books.length} книг`}
          title={`Популярное (${books.length})`}
        />
      }
      ListEmptyComponent={<Empty text="Нет популярных книг" />}
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );
}

// ── AllBooks ─────────────────────────────────────────────────────────
export function AllBooksScreen() {
  const nav = useNavigation<HomeNav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService
      .getAllBooks()
      .then((d) => { setBooks(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return (
    <FlatList
      style={s.list}
      data={books}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <BookListItem
          book={item}
          onPress={(b) => nav.navigate('BookDetail', { book: b })}
        />
      )}
      ListHeaderComponent={
        <Header
          label={`Все книги, ${books.length}`}
          title={`Все книги (${books.length})`}
        />
      }
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );
}

// ── Favorites ────────────────────────────────────────────────────────
export function FavoritesScreen() {
  const nav = useNavigation<HomeNav>();
  const { user } = useAuthStore();
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      bookService
        .getFavorites(user.id)
        .then((d) => { setFavs(d); setLoading(false); })
        .catch(() => setLoading(false));
    }, [user]),
  );

  if (loading) return <Loading />;
  return (
    <FlatList
      style={s.list}
      data={favs}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) =>
        item.book ? (
          <BookListItem
            book={item.book}
            onPress={(b) => nav.navigate('BookDetail', { book: b })}
          />
        ) : null
      }
      ListHeaderComponent={
        <Header
          label={`Избранное, ${favs.length} книг`}
          title={`Избранное (${favs.length})`}
        />
      }
      ListEmptyComponent={
        <View style={s.emptyBox}>
          <Text style={s.bigIcon} accessible={false}>❤️</Text>
          <Empty text="Нет избранных книг" />
          <Text style={s.hint} accessible={false}>
            Откройте книгу и нажмите «Добавить в избранное»
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
    />
  );
}

// ── Bookshelf ─────────────────────────────────────────────────────────
export function BookshelfScreen() {
  const nav = useNavigation<StackNavigationProp<any>>();
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const d = await bookService.getAllProgress(user.id).catch(() => []);
    setProgress(d);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  if (loading) return <Loading />;
  return (
    <FlatList
      style={s.list}
      data={progress}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) =>
        item.book ? (
          // ✅ Передаём только progressChapter (нет showProgress/progressPosition)
          <BookListItem
            book={item.book}
            onPress={(b) => nav.navigate('BookDetail', { book: b })}
            progressChapter={item.chapter_number}
          />
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          accessibilityLabel="Потяните для обновления"
        />
      }
      ListHeaderComponent={
        <Header
          label={`Книжная полка, ${progress.length} книг`}
          title={`Книжная полка (${progress.length})`}
          sub="Книги, которые вы слушали"
        />
      }
      ListEmptyComponent={
        <View style={s.emptyBox}>
          <Text style={s.bigIcon} accessible={false}>📚</Text>
          <Empty text="Полка пуста" />
          <Text style={s.hint} accessible={false}>
            Начните слушать книги — они сохранятся здесь
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#F9FAFB' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#9CA3AF',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  bigIcon: { fontSize: 64, marginBottom: 12 },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
  row: { paddingHorizontal: 12, gap: 12, marginBottom: 12 },
  genreCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  genreIcon: { fontSize: 36, marginBottom: 8 },
  genreName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});