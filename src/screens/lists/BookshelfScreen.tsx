import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, UserProgress } from '../../types';
import { bookService } from '../../services/bookService';
import { useAuthStore } from '../../store/authStore';
import BookListItem from '../../components/BookListItem';
import { colors } from '../../theme/designTokens';
import { SkeletonList, ListHeader, EmptyState, ErrorState, s, FLATLIST_PERF_PROPS, contentPadBottomGrow } from './shared';

type HomeNav = StackNavigationProp<HomeStackParamList>;

export function BookshelfScreen() {
  const nav = useNavigation<HomeNav>();
  const { user } = useAuthStore();
  const userId = user?.id;
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(false);
    const d = await bookService.getAllProgress(userId).catch(() => null);
    if (d === null) { setError(true); } else { setProgress(d); }
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const renderItem = useCallback(({ item }: { item: UserProgress }) =>
    item.book ? (
      <BookListItem
        book={item.book}
        onPress={b => nav.navigate('BookDetail', { book: b })}
        progressChapter={item.chapter_number}
      />
    ) : null,
  [nav]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const header = useMemo(() => (
    <ListHeader
      label={`Книжная полка, ${progress.length} книг`}
      title="Кітап сөресі"
      sub="Сіз тыңдаған кітаптар"
    />
  ), [progress.length]);

  const empty = useMemo(() => (
    <EmptyState
      icon="library-outline"
      title="Сөре бос"
      hint="Кітаптарды тыңдай бастаңыз — олар мұнда сақталады"
    />
  ), []);

  if (loading) return <SkeletonList />;
  if (error) return <ErrorState onRetry={() => { setLoading(true); load(); }} />;
  return (
    <FlatList
      style={s.list}
      data={progress}
      keyExtractor={i => i.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          accessibilityLabel="Потяните для обновления"
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      contentContainerStyle={contentPadBottomGrow}
      showsVerticalScrollIndicator={false}
      {...FLATLIST_PERF_PROPS}
    />
  );
}
