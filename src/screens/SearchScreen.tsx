import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SearchStackParamList, Book } from '../types';
import { bookService } from '../services/bookService';
import BookListItem from '../components/BookListItem';
import { announceForAccessibility } from '../utils/accessibility';

type Nav = StackNavigationProp<SearchStackParamList, 'Search'>;

export default function SearchScreen() {
  const nav = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback((text: string) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) { setResults([]); setSearched(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true); setSearched(true);
      const data = await bookService.searchBooks(text.trim()).catch(() => []);
      setResults(data);
      announceForAccessibility(data.length > 0 ? `Найдено ${data.length} книг` : 'Ничего не найдено');
      setLoading(false);
    }, 400);
  }, []);

  return (
    <View style={s.container}>
      <View style={s.bar}>
        <TextInput style={s.input} value={query} onChangeText={search}
          placeholder="Автор, название, диктор..." placeholderTextColor="#9CA3AF"
          accessible={true} accessibilityLabel="Поиск по библиотеке"
          accessibilityHint="Введите имя автора, название книги или имя диктора"
          returnKeyType="search" clearButtonMode="while-editing" />
        {loading && <ActivityIndicator style={{ marginLeft: 8 }} size="small" color="#2563EB" accessible={false} />}
      </View>
      <FlatList data={results} keyExtractor={i => i.id}
        renderItem={({ item }) => <BookListItem book={item} onPress={b => nav.navigate('BookDetail', { book: b })} />}
        ListEmptyComponent={
          searched && !loading
            ? <Text style={s.empty} accessible={true} accessibilityRole="text">По запросу «{query}» ничего не найдено</Text>
            : !searched
            ? <View style={s.ph}><Text style={s.phIcon} accessible={false}>🔍</Text>
                <Text style={s.phText} accessible={true} accessibilityRole="text">Введите автора или название книги</Text></View>
            : null
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#D1D5DB', minHeight: 52, elevation: 2 },
  input: { flex: 1, fontSize: 16, color: '#111827', paddingVertical: 14 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15, color: '#9CA3AF', paddingHorizontal: 24 },
  ph: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  phIcon: { fontSize: 56, marginBottom: 16 },
  phText: { fontSize: 16, color: '#9CA3AF', textAlign: 'center' },
});
