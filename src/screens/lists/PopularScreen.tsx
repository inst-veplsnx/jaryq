import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Book } from '../../types';
import { bookService } from '../../services/bookService';
import BookListItem from '../../components/BookListItem';
import { SkeletonList, ListHeader, EmptyState, ErrorState, s, FLATLIST_PERF_PROPS, contentPadBottom } from './shared';

type HomeNav = StackNavigationProp<HomeStackParamList>;

export function PopularScreen() {
  const nav = useNavigation<HomeNav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    bookService.getPopular().then(d => { setBooks(d); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = useCallback(({ item }: { item: Book }) => (
    <BookListItem book={item} onPress={b => nav.navigate('BookDetail', { book: b })} />
  ), [nav]);

  const header = useMemo(() => (
    <ListHeader label={`Популярное, ${books.length} книг`} title="Танымал" count={books.length} />
  ), [books.length]);

  const empty = useMemo(() => (
    <EmptyState
      icon="flame-outline"
      title="Танымал кітаптар әзірше жоқ"
      hint="Жақында топ-кітаптар пайда болады"
    />
  ), []);

  if (loading) return <SkeletonList />;
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
