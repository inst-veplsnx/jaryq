import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Book } from '../../types';
import { bookService } from '../../services/bookService';
import BookListItem from '../../components/BookListItem';
import { announceForAccessibility } from '../../utils/accessibility';
import { SkeletonList, ListHeader, EmptyState, ErrorState, s, FLATLIST_PERF_PROPS, contentPadBottom } from './shared';

type HomeNav = StackNavigationProp<HomeStackParamList>;

export function NewArrivalsScreen() {
  const nav = useNavigation<HomeNav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    bookService.getNewArrivals().then(d => {
      setBooks(d);
      setLoading(false);
      announceForAccessibility(`${d.length} новых книг`);
    }).catch(() => { setLoading(false); setError(true); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = useCallback(({ item }: { item: Book }) => (
    <BookListItem book={item} onPress={b => nav.navigate('BookDetail', { book: b })} />
  ), [nav]);

  const header = useMemo(() => (
    <ListHeader
      label={`Новые поступления, ${books.length} книг`}
      title="Жаңа кітаптар"
      count={books.length}
    />
  ), [books.length]);

  const empty = useMemo(() => (
    <EmptyState
      icon="sparkles-outline"
      title="Жаңадан түскен кітаптар жоқ"
      hint="Кейінірек кіріңіз — жаңа кітаптар жақында пайда болады"
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
