import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SearchStackParamList, Book } from '../types';
import { bookService } from '../services/bookService';
import BookListItem from '../components/BookListItem';
import Icon from '../components/Icon';
import { FLATLIST_PERF_PROPS } from './lists/shared';
import { announceForAccessibility } from '../utils/accessibility';
import { SEARCH_DEBOUNCE_MS } from '../utils/constants';
import { colors, radii, spacing, a11y } from '../theme/designTokens';
import { useAppScale } from '../theme/useAppScale';

type Nav = StackNavigationProp<SearchStackParamList, 'Search'>;

export default function SearchScreen() {
  const nav = useNavigation<Nav>();
  const { t, c } = useAppScale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<TextInput>(null);
  // Tracks the most recently submitted query to discard stale in-flight results
  const currentQueryRef = useRef('');

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const r = await bookService.searchBooks(q);
      if (q !== currentQueryRef.current) return; // discard stale result
      setResults(r);
      setSearched(true);
      announceForAccessibility(`Найдено ${r.length} книг`);
    } catch {
      if (q !== currentQueryRef.current) return;
      setResults([]);
      setSearched(true);
    } finally {
      if (q === currentQueryRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const onChange = (text: string) => {
    setQuery(text);
    currentQueryRef.current = text;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(text), SEARCH_DEBOUNCE_MS);
  };

  const renderItem = useCallback(({ item }: { item: Book }) => (
    <BookListItem book={item} onPress={b => nav.navigate('BookDetail', { book: b })} />
  ), [nav]);

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
    announceForAccessibility('Поиск очищен');
  };

  return (
    <View style={[s.container, { backgroundColor: c.bgMain }]}>
      {/* Строка поиска */}
      <View style={[s.searchWrapper, { backgroundColor: c.bgCard }]}>
        <View style={[s.bar, { backgroundColor: c.bgMain }, focused && s.barFocused]}>
          <Icon name="search-outline" size={22} color={focused ? colors.primary : c.textMuted} />
          <TextInput
            ref={inputRef}
            style={[s.input, { fontSize: t.md, color: c.textPrimary }]}
            value={query}
            onChangeText={onChange}
            placeholder="Автор немесе кітап атауы"
            placeholderTextColor={colors.textPlaceholder}
            returnKeyType="search"
            keyboardType="default"
            autoCapitalize="none"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            accessible={true}
            accessibilityLabel="Поле поиска"
            accessibilityHint="Введите автора или название книги для поиска"
          />
          {loading && (
            <ActivityIndicator size="small" color={colors.primary} accessible={false} />
          )}
          {query.length > 0 && !loading && (
            <TouchableOpacity
              onPress={clearQuery}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Очистить поиск"
              accessibilityHint="Дважды нажмите для очистки"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="close-circle" size={22} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Результаты */}
      <FlatList
        data={results}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        {...FLATLIST_PERF_PROPS}
        ListEmptyComponent={
          searched && !loading
            ? (
              <View style={s.emptyBox}>
                <View style={s.emptyIconWrap}>
                  <Icon name="search-outline" size={40} color={colors.primaryLight} />
                </View>
                <Text
                  style={[s.emptyTitle, { fontSize: t.xl, color: c.textPrimary }]}
                  accessible={true}
                  accessibilityRole="text"
                >
                  Ештеңе табылмады
                </Text>
                <Text style={[s.emptyHint, { fontSize: t.md, color: c.textMuted }]} accessible={false}>
                  «{query}» сұрауы бойынша нәтиже жоқ.{'\n'}Басқа сөздерді қолданыңыз.
                </Text>
              </View>
            )
            : !searched
              ? (
                <View style={s.placeholder}>
                  <View style={s.phIconWrap}>
                    <Image source={require('../../assets/icon.png')} style={s.phLogoImg} />
                  </View>
                  <Text style={[s.phTitle, { fontSize: t.xl, color: c.textPrimary }]} accessible={true} accessibilityRole="text">
                    Аудиокітап табыңыз
                  </Text>
                  <Text style={[s.phSub, { fontSize: t.md, color: c.textMuted }]} accessible={false}>
                    Атауын немесе автор атын енгізіңіз
                  </Text>
                </View>
              )
              : null
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    minHeight: a11y.minTouchTargetSmall + 4,
  },
  barFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.bgCard,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
  },

  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxxl,
    padding: spacing.xl,
  },
  phIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  phLogoImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  phTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  phSub: {
    textAlign: 'center',
  },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyHint: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
