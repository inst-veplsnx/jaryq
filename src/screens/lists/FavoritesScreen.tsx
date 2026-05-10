import React, { useState, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Favorite } from '../../types';
import { bookService } from '../../services/bookService';
import { useAuthStore } from '../../store/authStore';
import BookListItem from '../../components/BookListItem';
import { SkeletonList, ListHeader, EmptyState, ErrorState, s, FLATLIST_PERF_PROPS, contentPadBottomGrow } from './shared';

type HomeNav = StackNavigationProp<HomeStackParamList>;

export function FavoritesScreen() {
  const nav = useNavigation<HomeNav>();
  const { user } = useAuthStore();
  const userId = user?.id;
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFavorites = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    bookService.getFavorites(userId)
      .then(d => { setFavs(d); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [userId]);

  useFocusEffect(fetchFavorites);

  const renderItem = useCallback(({ item }: { item: Favorite }) =>
    item.book ? (
      <BookListItem book={item.book} onPress={b => nav.navigate('BookDetail', { book: b })} />
    ) : null,
  [nav]);

  const header = useMemo(() => (
    <ListHeader label={`Избранное, ${favs.length} книг`} title="Таңдаулы" count={favs.length} />
  ), [favs.length]);

  const empty = useMemo(() => (
    <EmptyState
      icon="heart-outline"
      title="Таңдаулы кітаптар жоқ"
      hint="Кітапты ашыңыз және «Таңдаулыға қосу» батырмасын басыңыз"
    />
  ), []);

  if (loading) return <SkeletonList />;
  if (error) return <ErrorState onRetry={fetchFavorites} />;
  return (
    <FlatList
      style={s.list}
      data={favs}
      keyExtractor={i => i.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      contentContainerStyle={contentPadBottomGrow}
      showsVerticalScrollIndicator={false}
      {...FLATLIST_PERF_PROPS}
    />
  );
}
