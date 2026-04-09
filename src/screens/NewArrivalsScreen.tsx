import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Book } from '../types';
import { bookService } from '../services/bookService';
import BookListItem from '../components/BookListItem';
import { announceForAccessibility } from '../utils/accessibility';

type NavProp = StackNavigationProp<HomeStackParamList, 'NewArrivals'>;

const NewArrivalsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService.getNewArrivals().then((data) => {
      setBooks(data);
      announceForAccessibility(`Загружено ${data.length} новых книг`);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
          accessible={true}
          accessibilityLabel="Загрузка книг..."
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={books}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <BookListItem
          book={item}
          onPress={(book) => navigation.navigate('BookDetail', { book })}
        />
      )}
      ListHeaderComponent={
        <View
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel={`Новые поступления. ${books.length} книг.`}
          style={styles.header}
        >
          <Text style={styles.headerTitle} accessible={false}>
            Новые поступления ({books.length})
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text
          style={styles.empty}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Нет новых книг"
        >
          Нет новых поступлений
        </Text>
      }
      contentContainerStyle={{ paddingBottom: 32 }}
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
  empty: { textAlign: 'center', marginTop: 48, fontSize: 16, color: '#9CA3AF' },
});

export default NewArrivalsScreen;
