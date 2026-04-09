import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BookshelfStackParamList, UserProgress } from '../types';
import { bookService } from '../services/bookService';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import BookListItem from '../components/BookListItem';
import { announceForAccessibility } from '../utils/accessibility';

type NavProp = StackNavigationProp<BookshelfStackParamList, 'Bookshelf'>;

const BookshelfScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuthStore();
  const { currentBook } = usePlayerStore();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await bookService.getAllProgress(user.id);
      setProgress(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" accessibilityLabel="Загрузка полки..." />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={progress}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) =>
        item.book ? (
          <BookListItem
            book={item.book}
            onPress={(book) => {
              navigation.navigate('BookDetail', { book });
            }}
            showProgress
            progressChapter={item.chapter_number}
            progressPosition={item.position}
          />
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          accessibilityLabel="Потяните для обновления"
        />
      }
      ListHeaderComponent={
        <View
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel={`Книжная полка. ${progress.length} книг с прогрессом.`}
          style={styles.header}
        >
          <Text style={styles.headerTitle} accessible={false}>
            Книжная полка ({progress.length})
          </Text>
          <Text style={styles.headerSub} accessible={false}>
            Книги, которые вы слушали
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon} accessible={false}>📚</Text>
          <Text
            style={styles.emptyText}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Полка пуста. Начните слушать книги и они появятся здесь."
          >
            Полка пуста
          </Text>
          <Text style={styles.emptyHint} accessible={false}>
            Начните слушать книги, и они сохранятся здесь
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});

export default BookshelfScreen;
