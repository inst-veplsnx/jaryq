import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Book } from '../../types';
import { bookService } from '../../services/bookService';
import BookListItem from '../../components/BookListItem';
import { SkeletonList, ListHeader, ErrorState, s, FLATLIST_PERF_PROPS, contentPadBottom } from './shared';

type HomeNav = StackNavigationProp<HomeStackParamList>;

const PAGE_SIZE = 50;

export function AllBooksScreen() {
  const nav = useNavigation<HomeNav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useMemo(() => ({ value: 0 }), []);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    offsetRef.value = 0;
    bookService.getAllBooks(0, PAGE_SIZE).then(d => {
      setBooks(d);
      setHasMore(d.length === PAGE_SIZE);
      setLoading(false);
    }).catch(() => { setLoading(false); setError(true); });
  }, [offsetRef]);

  useEffect(() => { load(); }, [load]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextOffset = offsetRef.value + PAGE_SIZE;
    bookService.getAllBooks(nextOffset, PAGE_SIZE).then(d => {
      offsetRef.value = nextOffset;
      setBooks(prev => [...prev, ...d]);
      setHasMore(d.length === PAGE_SIZE);
      setLoadingMore(false);
    }).catch(() => setLoadingMore(false));
  }, [loadingMore, hasMore, offsetRef]);

  const renderItem = useCallback(({ item }: { item: Book }) => (
    <BookListItem book={item} onPress={b => nav.navigate('BookDetail', { book: b })} />
  ), [nav]);

  const header = useMemo(() => (
    <ListHeader label={`Все книги, ${books.length}`} title="Барлық кітаптар" count={books.length} />
  ), [books.length]);

  if (loading) return <SkeletonList />;
  if (error) return <ErrorState onRetry={load} />;
  return (
    <FlatList
      style={s.list}
      data={books}
      keyExtractor={i => i.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      contentContainerStyle={contentPadBottom}
      showsVerticalScrollIndicator={false}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      {...FLATLIST_PERF_PROPS}
    />
  );
}
