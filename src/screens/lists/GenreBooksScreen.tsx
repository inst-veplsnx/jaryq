import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Book } from '../../types';
import { bookService } from '../../services/bookService';
import BookListItem from '../../components/BookListItem';
import { Loading, ListHeader, EmptyState, ErrorState, s, FLATLIST_PERF_PROPS, contentPadBottom } from './shared';

type HomeNav = StackNavigationProp<HomeStackParamList>;

export function GenreBooksScreen() {
  const nav = useNavigation<HomeNav>();
  const { params } = useRoute<RouteProp<HomeStackParamList, 'GenreBooks'>>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    bookService.getBooksByGenre(params.genre.id)
      .then(d => { setBooks(d); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [params.genre.id]);

  useEffect(() => { load(); }, [load]);

  const renderItem = useCallback(({ item }: { item: Book }) => (
    <BookListItem book={item} onPress={b => nav.navigate('BookDetail', { book: b })} />
  ), [nav]);

  const header = useMemo(() => (
    <ListHeader
      label={`${params.genre.name}, ${books.length} книг`}
      title={params.genre.name}
      count={books.length}
    />
  ), [params.genre.name, books.length]);

  const empty = useMemo(() => (
    <EmptyState
      icon="book-outline"
      title="Бұл жанрда кітаптар жоқ"
      hint="Басқа жанрды көріңіз"
    />
  ), []);

  if (loading) return <Loading />;
  if (error) return <ErrorState onRetry={load} />;
  return (
    <FlatList
      style={s.list}
      data={books}
      keyExtractor={i => i.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      contentContainerStyle={contentPadBottom}
      showsVerticalScrollIndicator={false}
      {...FLATLIST_PERF_PROPS}
    />
  );
}
