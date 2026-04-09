import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Chapter } from '../types';
import { bookService } from '../services/bookService';
import { useAuthStore } from '../store/authStore';
import AccessibleButton from '../components/AccessibleButton';
import { formatTime, formatTimeVoice, announceForAccessibility } from '../utils/accessibility';

type Nav = StackNavigationProp<HomeStackParamList, 'BookDetail'>;
type Route = RouteProp<HomeStackParamList, 'BookDetail'>;

export default function BookDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params: { book } } = useRoute<Route>();
  const { user } = useAuthStore();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [savedProgress, setSaved] = useState<{ chapter: number; position: number } | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      bookService.getChapters(book.id),
      user ? bookService.isFavorite(user.id, book.id) : false,
      user ? bookService.getProgress(user.id, book.id) : null,
    ]).then(([chs, fav, prog]) => {
      setChapters(chs);
      setIsFav(fav as boolean);
      if (prog) setSaved({ chapter: prog.chapter_number, position: prog.position });
      setLoadingData(false);
    });
  }, [book.id, user]);

  const toggleFav = async () => {
    if (!user) return;
    setFavLoading(true);
    if (isFav) {
      await bookService.removeFavorite(user.id, book.id);
      setIsFav(false);
      announceForAccessibility('Удалено из избранного');
    } else {
      await bookService.addFavorite(user.id, book.id);
      setIsFav(true);
      announceForAccessibility('Добавлено в избранное');
    }
    setFavLoading(false);
  };

  const a11yHeader = [
    `${book.author} — ${book.title}`,
    book.narrator ? `Читает ${book.narrator}` : null,
    book.total_duration ? `Длительность ${formatTimeVoice(book.total_duration)}` : null,
    book.total_chapters ? `${book.total_chapters} глав` : null,
    book.genre?.name ? `Жанр: ${book.genre.name}` : null,
  ].filter(Boolean).join('. ');

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Обложка + мета */}
      <View accessible={true} accessibilityRole="header" accessibilityLabel={a11yHeader} style={s.top}>
        <View style={s.cover} accessible={false}>
          {book.cover_url
            ? <Image source={{ uri: book.cover_url }} style={s.coverImg} accessible={false} />
            : <View style={s.coverPh}><Text style={s.coverIcon} accessible={false}>📖</Text></View>}
        </View>
        <View style={s.meta} accessible={false}>
          <Text style={s.author} accessible={false}>{book.author}</Text>
          <Text style={s.title} accessible={false}>{book.title}</Text>
          {book.narrator ? <Text style={s.narrator} accessible={false}>🎤 {book.narrator}</Text> : null}
          {book.genre?.name
            ? <View style={s.badge}><Text style={s.badgeT} accessible={false}>{book.genre.name}</Text></View>
            : null}
          {book.total_duration
            ? <Text style={s.dur} accessible={false}>⏱ {formatTime(book.total_duration)}</Text>
            : null}
        </View>
      </View>

      {/* Описание */}
      {book.description
        ? <View style={s.section}>
            <Text style={s.sectionTitle} accessible={true} accessibilityRole="header">Описание</Text>
            <Text style={s.desc} accessible={true} accessibilityRole="text" accessibilityLabel={`Описание: ${book.description}`}>{book.description}</Text>
          </View>
        : null}

      {/* Кнопки */}
      <View style={s.actions}>
        {savedProgress
          ? <AccessibleButton
              label={`Продолжить с главы ${savedProgress.chapter}`}
              hint="Дважды нажмите, чтобы продолжить с того места, где остановились"
              onPress={() => nav.navigate('Player', { book, chapterIndex: savedProgress.chapter - 1 })}
              style={s.actionBtn} />
          : null}
        <AccessibleButton
          label="Слушать с начала"
          hint="Дважды нажмите для прослушивания с первой главы"
          onPress={() => nav.navigate('Player', { book, chapterIndex: 0 })}
          variant={savedProgress ? 'secondary' : 'primary'}
          style={s.actionBtn} />
        <AccessibleButton
          label={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
          hint={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
          onPress={toggleFav}
          variant="ghost"
          loading={favLoading}
          style={s.actionBtn} />
      </View>

      {/* Главы */}
      <View style={s.section}>
        <Text style={s.sectionTitle} accessible={true} accessibilityRole="header"
          accessibilityLabel={`Список глав, всего ${chapters.length}`}>
          Главы ({chapters.length})
        </Text>
        {loadingData
          ? <ActivityIndicator color="#2563EB" style={{ marginTop: 16 }} accessible={true} accessibilityLabel="Загрузка глав..." />
          : chapters.map(ch => (
              <TouchableOpacity
                key={ch.id}
                style={[s.chapterRow, savedProgress?.chapter === ch.chapter_number && s.chapterActive]}
                onPress={() => nav.navigate('Player', { book, chapterIndex: ch.chapter_number - 1 })}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Глава ${ch.chapter_number}${ch.title ? ': ' + ch.title : ''}. ${formatTimeVoice(ch.duration)}`}
                accessibilityHint="Дважды нажмите для воспроизведения"
                accessibilityState={{ selected: savedProgress?.chapter === ch.chapter_number }}>
                <Text style={s.chNum} accessible={false}>{ch.chapter_number}</Text>
                <View style={s.chInfo} accessible={false}>
                  <Text style={s.chTitle} accessible={false}>{ch.title || `Глава ${ch.chapter_number}`}</Text>
                  <Text style={s.chDur} accessible={false}>{formatTime(ch.duration)}</Text>
                </View>
                {savedProgress?.chapter === ch.chapter_number
                  ? <Text style={s.nowPlaying} accessible={false}>▶</Text>
                  : null}
              </TouchableOpacity>
            ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  top: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', gap: 16, marginBottom: 8 },
  cover: { width: 90, height: 120, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F3F4F6', flexShrink: 0 },
  coverImg: { width: '100%', height: '100%' },
  coverPh: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverIcon: { fontSize: 36 },
  meta: { flex: 1 },
  author: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', lineHeight: 24, marginBottom: 6 },
  narrator: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginBottom: 6 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  badgeT: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  dur: { fontSize: 13, color: '#6B7280' },
  section: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  desc: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  actions: { backgroundColor: '#fff', padding: 16, gap: 10, marginBottom: 8 },
  actionBtn: {},
  chapterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', minHeight: 56, gap: 12 },
  chapterActive: { backgroundColor: '#EFF6FF' },
  chNum: { width: 30, fontSize: 14, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },
  chInfo: { flex: 1 },
  chTitle: { fontSize: 14, color: '#111827', fontWeight: '500' },
  chDur: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  nowPlaying: { fontSize: 16, color: '#2563EB' },
});
