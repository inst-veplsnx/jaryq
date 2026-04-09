import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, AppState,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AVPlaybackStatus } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { HomeStackParamList, Chapter } from '../types';
import { bookService } from '../services/bookService';
import { audioService } from '../services/audioService';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { formatTime, formatTimeVoice, announceForAccessibility } from '../utils/accessibility';

type Route = RouteProp<HomeStackParamList, 'Player'>;

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default function PlayerScreen() {
  const { params: { book, chapterIndex: startIdx = 0 } } = useRoute<Route>();
  const { user } = useAuthStore();
  const { speed, set } = usePlayerStore();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterIndex, setChapterIndex] = useState(startIdx);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setInterval>>();
  const chaptersRef = useRef<Chapter[]>([]);
  const chapterIndexRef = useRef(startIdx);
  const positionRef = useRef(0);

  // ── Статус обновления от expo-av ──────────────────────────────
  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    const pos = (status.positionMillis || 0) / 1000;
    const dur = (status.durationMillis || 0) / 1000;
    setPosition(pos);
    setDuration(dur);
    positionRef.current = pos;
    set({ isPlaying: status.isPlaying, position: pos, duration: dur });

    // Авто-следующая глава
    if (status.didJustFinish) {
      const nextIdx = chapterIndexRef.current + 1;
      if (nextIdx < chaptersRef.current.length) {
        loadChapter(nextIdx, 0);
      } else {
        announceForAccessibility('Книга завершена');
        setIsPlaying(false);
      }
    }
  }, []);

  // ── Загрузка главы ────────────────────────────────────────────
  const loadChapter = useCallback(async (idx: number, startPos = 0) => {
    const chs = chaptersRef.current;
    if (!chs[idx]) return;
    setLoading(true);
    setChapterIndex(idx);
    chapterIndexRef.current = idx;
    set({ chapterIndex: idx, currentChapter: chs[idx] });
    await audioService.loadChapter(chs[idx], onStatus, startPos);
    await audioService.play();
    await audioService.setSpeed(speed);
    setIsPlaying(true);
    setLoading(false);
    announceForAccessibility(`Глава ${chs[idx].chapter_number}${chs[idx].title ? ': ' + chs[idx].title : ''}`);
  }, [speed, onStatus]);

  // ── Инициализация ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await audioService.setup();
      const chs = await bookService.getChapters(book.id).catch(() => []);
      chaptersRef.current = chs;
      setChapters(chs);
      if (!chs.length) { setLoading(false); return; }
      set({ currentBook: book, currentChapter: chs[startIdx] });

      let idx = startIdx;
      let pos = 0;
      if (user && startIdx === 0) {
        const prog = await bookService.getProgress(user.id, book.id).catch(() => null);
        if (prog) { idx = prog.chapter_number - 1; pos = prog.position; }
      }
      await loadChapter(idx, pos);
    };
    init();
    activateKeepAwakeAsync();

    // Автосохранение каждые 10с
    saveTimer.current = setInterval(() => { doSave(); }, 10_000);

    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
      doSave();
      audioService.unload();
      deactivateKeepAwake();
    };
  }, []);

  const doSave = useCallback(async () => {
    if (!user) return;
    const chs = chaptersRef.current;
    const idx = chapterIndexRef.current;
    const ch = chs[idx];
    if (!ch) return;
    await bookService.saveProgress(user.id, book.id, ch.id, ch.chapter_number, Math.floor(positionRef.current));
  }, [user, book.id]);

  // ── Управление ────────────────────────────────────────────────
  const togglePlay = async () => {
    if (isPlaying) { await audioService.pause(); announceForAccessibility('Пауза'); }
    else { await audioService.play(); announceForAccessibility('Воспроизведение'); }
  };

  const skipNext = () => {
    if (chapterIndex < chapters.length - 1) loadChapter(chapterIndex + 1, 0);
  };

  const skipPrev = () => {
    if (position > 5) { audioService.seekTo(0); return; }
    if (chapterIndex > 0) loadChapter(chapterIndex - 1, 0);
  };

  const seekBackward = async () => {
    await audioService.seekTo(Math.max(0, position - 30));
    announceForAccessibility('Назад 30 секунд');
  };

  const seekForward = async () => {
    await audioService.seekTo(position + 30);
    announceForAccessibility('Вперёд 30 секунд');
  };

  const cycleSpeed = async () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    set({ speed: next });
    await audioService.setSpeed(next);
    announceForAccessibility(`Скорость ${Math.round(next * 100)} процентов`);
  };

  // ── Данные для отображения ────────────────────────────────────
  const ch = chapters[chapterIndex];
  const chLabel = ch ? `Глава ${ch.chapter_number}${ch.title ? ': ' + ch.title : ''}` : '...';
  const pct = duration > 0 ? Math.round((position / duration) * 100) : 0;

  const a11yBlock = [
    `${book.author} — ${book.title}`,
    chLabel,
    `${formatTimeVoice(position)} из ${formatTimeVoice(duration)}`,
    `${pct} процентов`,
    isPlaying ? 'Играет' : 'Пауза',
    `Скорость ${Math.round(speed * 100)} процентов`,
  ].join('. ');

  if (loading && chapters.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#2563EB" accessibilityLabel="Загрузка аудиокниги..." />
        <Text style={s.loadingTxt} accessible={true} accessibilityRole="text">Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>

      {/* Инфо блок — весь читается TalkBack как один элемент */}
      <View accessible={true} accessibilityRole="header" accessibilityLabel={a11yBlock} style={s.infoBlock}>
        {book.cover_url
          ? <Image source={{ uri: book.cover_url }} style={s.cover} accessible={false} />
          : <View style={s.coverPh}><Text style={s.coverIcon} accessible={false}>📖</Text></View>}
        <Text style={s.author} accessible={false}>{book.author}</Text>
        <Text style={s.bookTitle} accessible={false}>{book.title}</Text>
        {book.narrator ? <Text style={s.narrator} accessible={false}>🎤 {book.narrator}</Text> : null}
        {loading
          ? <ActivityIndicator color="#2563EB" style={{ marginTop: 8 }} accessible={false} />
          : <Text style={s.chLabel} accessible={false}>{chLabel}</Text>}
        <Text style={s.chCount} accessible={false}>{chapterIndex + 1} из {chapters.length}</Text>
      </View>

      {/* Слайдер прогресса */}
      <View style={s.sliderWrap} accessible={false}>
        <Slider
          style={s.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={isSeeking ? undefined : position}
          minimumTrackTintColor="#2563EB"
          maximumTrackTintColor="#D1D5DB"
          thumbTintColor="#2563EB"
          onSlidingStart={() => setIsSeeking(true)}
          onSlidingComplete={async (v) => { setIsSeeking(false); await audioService.seekTo(v); }}
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel={`Позиция: ${formatTimeVoice(position)} из ${formatTimeVoice(duration)}`}
          accessibilityHint="Проведите вверх или вниз для перемотки"
        />
        <View style={s.timeRow} accessible={false}>
          <Text style={s.timeText} accessible={false}>{formatTime(position)}</Text>
          <Text style={s.timeText} accessible={false}>-{formatTime(Math.max(0, duration - position))}</Text>
        </View>
      </View>

      {/* ±30 секунд */}
      <View style={s.seekRow} accessible={false}>
        <TouchableOpacity style={s.seekBtn} onPress={seekBackward}
          accessible={true} accessibilityRole="button"
          accessibilityLabel="Назад 30 секунд" accessibilityHint="Дважды нажмите для перемотки назад на 30 секунд">
          <Text style={s.seekBtnTxt} accessible={false}>⏪ 30с</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.seekBtn} onPress={seekForward}
          accessible={true} accessibilityRole="button"
          accessibilityLabel="Вперёд 30 секунд" accessibilityHint="Дважды нажмите для перемотки вперёд на 30 секунд">
          <Text style={s.seekBtnTxt} accessible={false}>30с ⏩</Text>
        </TouchableOpacity>
      </View>

      {/* Главные кнопки */}
      <View style={s.controls} accessible={false}>
        <TouchableOpacity style={[s.ctrlBtn, chapterIndex === 0 && s.disabled]} onPress={skipPrev}
          disabled={chapterIndex === 0}
          accessible={true} accessibilityRole="button"
          accessibilityLabel="Предыдущая глава"
          accessibilityHint="Дважды нажмите для перехода к предыдущей главе"
          accessibilityState={{ disabled: chapterIndex === 0 }}>
          <Text style={s.ctrlIcon} accessible={false}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.playBtn} onPress={togglePlay}
          accessible={true} accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Пауза' : 'Воспроизвести'}
          accessibilityHint={isPlaying ? 'Дважды нажмите для паузы' : 'Дважды нажмите для воспроизведения'}
          accessibilityState={{ selected: isPlaying }}>
          {loading
            ? <ActivityIndicator color="#fff" accessible={false} />
            : <Text style={s.playIcon} accessible={false}>{isPlaying ? '⏸' : '▶'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[s.ctrlBtn, chapterIndex >= chapters.length - 1 && s.disabled]} onPress={skipNext}
          disabled={chapterIndex >= chapters.length - 1}
          accessible={true} accessibilityRole="button"
          accessibilityLabel="Следующая глава"
          accessibilityHint="Дважды нажмите для перехода к следующей главе"
          accessibilityState={{ disabled: chapterIndex >= chapters.length - 1 }}>
          <Text style={s.ctrlIcon} accessible={false}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Скорость */}
      <TouchableOpacity style={s.speedBtn} onPress={cycleSpeed}
        accessible={true} accessibilityRole="button"
        accessibilityLabel={`Скорость воспроизведения: ${Math.round(speed * 100)} процентов`}
        accessibilityHint="Дважды нажмите для изменения скорости. Доступные значения: 75, 100, 125, 150, 175, 200 процентов">
        <Text style={s.speedTxt} accessible={false}>Скорость: {Math.round(speed * 100)}%</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 16, color: '#6B7280' },
  infoBlock: { alignItems: 'center', width: '100%', marginBottom: 24 },
  cover: { width: 150, height: 190, borderRadius: 12, marginBottom: 16, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12 },
  coverPh: { width: 150, height: 190, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  coverIcon: { fontSize: 64 },
  author: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  bookTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', lineHeight: 26, marginBottom: 4 },
  narrator: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 6 },
  chLabel: { fontSize: 14, color: '#2563EB', fontWeight: '600', textAlign: 'center' },
  chCount: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  sliderWrap: { width: '100%', marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  timeText: { fontSize: 13, color: '#6B7280' },
  seekRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  seekBtn: { minWidth: 90, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 22, paddingHorizontal: 16 },
  seekBtnTxt: { fontSize: 14, fontWeight: '600', color: '#374151' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 28, marginBottom: 20 },
  ctrlBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  ctrlIcon: { fontSize: 32 },
  playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 10 },
  playIcon: { fontSize: 34, color: '#fff' },
  speedBtn: { minHeight: 44, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  speedTxt: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
