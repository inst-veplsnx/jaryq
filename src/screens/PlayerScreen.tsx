import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert, ScrollView, Animated,
  Modal, FlatList,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AVPlaybackStatus } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Book, Chapter } from '../types';
import { bookService } from '../services/bookService';
import { audioService } from '../services/audioService';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useDownloadStore } from '../store/downloadStore';
import { useCoverSource } from '../hooks/useCoverSource';
import { useSettingsStore } from '../store/settingsStore';
import { colors, typography, radii, spacing, a11y, interaction } from '../theme/designTokens';
import { useAppScale } from '../theme/useAppScale';
import { formatTime, formatTimeVoice, announceForAccessibility } from '../utils/accessibility';
import { AUTOSAVE_INTERVAL_MS, SEEK_STEP_SECONDS } from '../utils/constants';
import Icon from '../components/Icon';

type PlayerRouteParams = { book: Book; chapterIndex?: number };
type PlayerRoute = RouteProp<Record<string, PlayerRouteParams>, string>;

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default function PlayerScreen() {
  const route = useRoute<PlayerRoute>();
  useNavigation();
  const { book, chapterIndex: startIdx = 0 } = route.params || {};
  const { user } = useAuthStore();
  const { speed, set } = usePlayerStore();
  const { keepScreenOn, autoSave, speed: savedSpeed, setSpeed: persistSpeed } = useSettingsStore();
  const { t, c } = useAppScale();
  const downloadChapter     = useDownloadStore(s => s.downloadChapter);
  const deleteChapter       = useDownloadStore(s => s.deleteChapter);
  const isChapterDownloaded = useDownloadStore(s => s.isChapterDownloaded);
  const downloads           = useDownloadStore(s => s.downloads);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterIndex, setChapterIndex] = useState(startIdx);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [advancingChapter, setAdvancingChapter] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const advanceOverlayOpacity = useRef(new Animated.Value(0)).current;
  const [resumeMsg, setResumeMsg] = useState<string | null>(null);
  const resumeOpacity = useRef(new Animated.Value(0)).current;

  const chaptersRef = useRef<Chapter[]>([]);
  const chapterIndexRef = useRef(startIdx);
  const positionRef = useRef(0);
  const loadChapterRef = useRef<((idx: number, startPos?: number) => Promise<void>) | null>(null);
  const doSaveRef = useRef<(() => Promise<void>) | null>(null);
  const speedRef = useRef(speed);
  const didFinishRef = useRef(false);

  const lastSavedPositionRef = useRef<number>(-1);

  const doSave = useCallback(async () => {
    if (!user || !book?.id) return;
    const ch = chaptersRef.current[chapterIndexRef.current];
    if (!ch) return;
    const pos = Math.floor(positionRef.current);
    if (Math.abs(pos - lastSavedPositionRef.current) < 3) return;
    lastSavedPositionRef.current = pos;
    await bookService.saveProgress(
      user.id, book.id, ch.id, ch.chapter_number, pos,
    ).catch(() => {});
  }, [user, book?.id]);

  useEffect(() => { doSaveRef.current = doSave; }, [doSave]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setIsBuffering(!!status.isBuffering && status.isPlaying);
    const pos = (status.positionMillis || 0) / 1000;
    const dur = (status.durationMillis || 0) / 1000;
    setPosition(pos);
    setDuration(dur);
    positionRef.current = pos;
    set({ isPlaying: status.isPlaying, position: pos, duration: dur });

    if (status.didJustFinish && !didFinishRef.current) {
      didFinishRef.current = true;
      const nextIdx = chapterIndexRef.current + 1;
      if (nextIdx < chaptersRef.current.length) {
        const nextTitle = chaptersRef.current[nextIdx]?.title || `Глава ${nextIdx + 1}`;
        announceForAccessibility(`Следующая глава: ${nextTitle}`);
        setAdvancingChapter(true);
        Animated.timing(advanceOverlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true })
          .start(() => { loadChapterRef.current?.(nextIdx, 0); });
      } else {
        announceForAccessibility('Книга завершена');
        setIsPlaying(false);
      }
    }
  }, [set]);

  const loadChapter = useCallback(async (idx: number, startPos = 0) => {
    if (!book?.id) return;
    try {
      const chs = chaptersRef.current;
      if (!chs[idx]) return;
      setLoading(true);
      setInitError(null);
      setChapterIndex(idx);
      chapterIndexRef.current = idx;
      set({ chapterIndex: idx, currentChapter: chs[idx] });

      const currentChapter = chs[idx];
      const downloaded = isChapterDownloaded(book.id, currentChapter.id);
      let chapterLocalUri: string | null = null;
      if (downloaded) {
        chapterLocalUri = await audioService.getLocalUriForChapter(currentChapter, book);
        setLocalUri(chapterLocalUri);
      } else {
        setLocalUri(null);
      }

      didFinishRef.current = false;
      await audioService.loadChapter(chs[idx], onStatus, startPos, chapterLocalUri || undefined);
      await audioService.play();
      await audioService.setSpeed(speedRef.current);
      setLoading(false);
      setAdvancingChapter(false);
      Animated.timing(advanceOverlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      announceForAccessibility(chs[idx].title || `Глава ${chs[idx].chapter_number}`);
    } catch (err: any) {
      setInitError(err?.message || 'Тарауды жүктеу қатесі');
      setLoading(false);
      Alert.alert('Қате', `Тарауды жүктеу сәтсіз аяқталды: ${err?.message || 'белгісіз қате'}`);
    }
  }, [onStatus, book?.id, isChapterDownloaded, set]);

  useEffect(() => { loadChapterRef.current = loadChapter; }, [loadChapter]);

  useEffect(() => {
    if (!book?.id) return;
    let cancelled = false;

    const init = async () => {
      try {
        await audioService.setup();
        if (savedSpeed !== speed) {
          set({ speed: savedSpeed });
          speedRef.current = savedSpeed;
        }
        const chs = await bookService.getChapters(book.id);
        if (cancelled) return;
        chaptersRef.current = chs;
        setChapters(chs);
        if (!chs.length) {
          setLoading(false);
          setInitError('Қолжетімді тараулар жоқ');
          return;
        }
        set({ currentBook: book, currentChapter: chs[startIdx] });

        let idx = startIdx;
        let pos = 0;
        if (user && startIdx === 0) {
          const prog = await bookService.getProgress(user.id, book.id);
          if (prog) {
            idx = Math.max(0, prog.chapter_number - 1);
            pos = prog.position;
            if (pos > 0) setResumeMsg(`${formatTime(pos)} сәтінен жалғастыру`);
          }
        }
        if (!cancelled) {
          await loadChapterRef.current?.(idx, pos);
        }
      } catch (err: any) {
        if (!cancelled) {
          setInitError(err?.message || 'Инициализация қатесі');
          setLoading(false);
          Alert.alert('Қате', `Кітапты жүктеу сәтсіз аяқталды: ${err?.message || 'белгісіз қате'}`);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      doSaveRef.current?.();
      audioService.unload();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Intentional empty dep array: book, user, startIdx are stable navigation params for the
  // lifetime of this screen. loadChapterRef and doSaveRef are mutable refs that bridge to
  // current callbacks, guaranteed to be set by the sibling useEffect at line 124 before
  // the async init() reaches loadChapterRef.current?.().
  }, []);

  useEffect(() => {
    if (keepScreenOn) activateKeepAwakeAsync();
    return () => { if (keepScreenOn) deactivateKeepAwake(); };
  }, [keepScreenOn]);

  useEffect(() => {
    if (!autoSave) return;
    const id = setInterval(() => doSaveRef.current?.(), AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [autoSave, book?.id, user?.id]);

  useEffect(() => {
    if (!resumeMsg) return;
    announceForAccessibility(`Возобновление с ${formatTime(positionRef.current)}`);
    Animated.sequence([
      Animated.timing(resumeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(resumeOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setResumeMsg(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeMsg]);

  if (!book?.id) {
    return (
      <View style={s.center}>
        <Icon name="warning" size={56} color={colors.textMuted} />
        <Text style={s.errorText} accessible={true} accessibilityRole="alert">Кітап табылмады</Text>
      </View>
    );
  }

  const togglePlay = async () => {
    if (loading) return;
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
    try {
      await audioService.seekTo(Math.max(0, position - SEEK_STEP_SECONDS));
      announceForAccessibility(`Назад ${SEEK_STEP_SECONDS} секунд`);
    } catch { /* seek failed, don't mislead user */ }
  };

  const seekForward = async () => {
    try {
      await audioService.seekTo(Math.min(duration, position + SEEK_STEP_SECONDS));
      announceForAccessibility(`Вперёд ${SEEK_STEP_SECONDS} секунд`);
    } catch { /* seek failed, don't mislead user */ }
  };

  const cycleSpeed = async () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    set({ speed: next });
    speedRef.current = next;
    await audioService.setSpeed(next);
    await persistSpeed(next);
    announceForAccessibility(`Скорость ${Math.round(next * 100)} процентов`);
  };

  const handleDownloadChapter = async () => {
    const ch = chapters[chapterIndex];
    if (!ch) return;

    const downloaded = isChapterDownloaded(book.id, ch.id);
    if (downloaded) {
      await deleteChapter(book.id, ch.id);
      setLocalUri(null);
      announceForAccessibility('Загрузка удалена');
    } else {
      announceForAccessibility('Начало загрузки главы');
      try {
        await downloadChapter(ch, book);
        const newUri = await audioService.getLocalUriForChapter(ch, book);
        setLocalUri(newUri);
        announceForAccessibility('Загрузка завершена');
      } catch {
        announceForAccessibility('Ошибка загрузки');
      }
    }
  };

  const renderChapterItem = useCallback(({ item, index }: { item: Chapter; index: number }) => (
    <TouchableOpacity
      style={[s.chRow, index === chapterIndex && s.chRowActive]}
      onPress={() => { setShowChapterList(false); loadChapter(index, 0); }}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.title || `Глава ${item.chapter_number}`}${item.duration ? `, ${item.duration} секунд` : ''}`}
      accessibilityHint="Дважды нажмите для перехода к этой главе"
      accessibilityState={{ selected: index === chapterIndex }}
      activeOpacity={interaction.activeOpacity}
    >
      <View style={s.chRowLeft} accessible={false}>
        {index === chapterIndex
          ? <Icon name="volume-medium" size={16} color={colors.primary} />
          : <Text style={[s.chNum, { fontSize: t.xs, color: c.textMuted }]} accessible={false}>{index + 1}</Text>}
      </View>
      <View style={s.chRowInfo} accessible={false}>
        <Text
          style={[s.chRowTitle, { fontSize: t.md, color: index === chapterIndex ? colors.primary : c.textPrimary }]}
          accessible={false}
          numberOfLines={2}
        >
          {item.title || `Тарау ${item.chapter_number}`}
        </Text>
        {item.duration ? (
          <Text style={[s.chRowDur, { fontSize: t.xs, color: c.textMuted }]} accessible={false}>
            {formatTime(item.duration)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  ), [chapterIndex, loadChapter, t, c]);

  const downloadKey = chapters[chapterIndex] ? `${book.id}-${chapters[chapterIndex].id}` : null;
  const downloadInfo = downloadKey ? downloads[downloadKey] : null;
  const isDownloaded = chapters[chapterIndex] ? isChapterDownloaded(book.id, chapters[chapterIndex].id) : false;
  const isDownloading = downloadInfo?.status === 'downloading';
  const downloadProgress = downloadInfo?.progress || 0;

  const ch = chapters[chapterIndex];
  const chLabel   = ch ? (ch.title || `Тарау ${ch.chapter_number}`) : '...';
  const chLabelRu = ch ? (ch.title || `Глава ${ch.chapter_number}`) : '...';
  const pct = duration > 0 ? Math.round((position / duration) * 100) : 0;

  const coverSource = useCoverSource(book);

  const a11yBlock = [
    `${book.author} — ${book.title}`,
    chLabelRu,
    `${formatTimeVoice(position)} из ${formatTimeVoice(duration)}`,
    `${pct} процентов`,
    isPlaying ? 'Играет' : 'Пауза',
    `Скорость ${Math.round(speed * 100)} процентов`,
    isDownloaded ? 'Доступно офлайн' : 'Требуется интернет',
  ].join('. ');

  if (initError && chapters.length === 0) {
    return (
      <View style={s.center}>
        <Icon name="warning-outline" size={56} color={colors.error} />
        <Text style={s.errorText} accessible={true} accessibilityRole="alert">{initError}</Text>
        <TouchableOpacity
          style={s.retryBtn}
          onPress={() => loadChapter(chapterIndex, position)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Повторить попытку"
          accessibilityHint="Дважды нажмите для повторной загрузки"
        >
          <Text style={s.retryBtnText} accessible={false}>Қайталау</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && chapters.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Загрузка аудиокниги..." />
        <Text style={s.loadingTxt} accessible={true} accessibilityRole="text" accessibilityLabel="Загрузка...">Жүктелуде...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Обложка + мета */}
      <View accessible={true} accessibilityRole="header" accessibilityLabel={a11yBlock} style={s.infoBlock}>
        <View style={s.coverShadowWrap} accessible={false}>
          {coverSource
            ? <Image source={coverSource} style={s.cover} accessible={false} />
            : (
              <View style={s.coverPh} accessible={false}>
                <Icon name="book" size={64} color={colors.textPlaceholder} />
              </View>
            )}
        </View>

        <Text style={[s.author, { fontSize: t.xs, color: c.textMuted }]} accessible={false}>{book.author}</Text>
        <Text style={[s.bookTitle, { fontSize: t.xxl, color: c.textPrimary }]} accessible={false} numberOfLines={2}>{book.title}</Text>
        {book.narrator ? (
          <View style={s.narratorRow} accessible={false}>
            <Icon name="mic" size={14} color={c.textMuted} />
            <Text style={[s.narrator, { fontSize: t.sm, color: c.textMuted }]} accessible={false}> {book.narrator}</Text>
          </View>
        ) : null}

        {loading
          ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} accessible={false} />
          : (
            <View style={s.chapterBadge} accessible={false}>
              <Text style={[s.chLabel, { fontSize: t.sm }]} accessible={false}>{chLabel}</Text>
              <Text style={[s.chCount, { fontSize: t.xs, color: c.textMuted }]} accessible={false}>{chapterIndex + 1} / {chapters.length}</Text>
            </View>
          )}
      </View>

      {/* Тост возобновления */}
      {resumeMsg ? (
        <Animated.View
          style={[s.resumeToast, { opacity: resumeOpacity }]}
          accessible={false}
          pointerEvents="none"
        >
          <Icon name="time-outline" size={14} color={colors.textOnPrimary} />
          <Text style={s.resumeToastTxt} accessible={false}>{resumeMsg}</Text>
        </Animated.View>
      ) : null}

      {/* Прогресс */}
      <View style={s.sliderSection} accessible={false}>
        {isBuffering && (
          <View
            style={s.bufferingRow}
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityLabel="Буферизация..."
          >
            <ActivityIndicator size="small" color={colors.primary} accessible={false} />
            <Text style={[s.bufferingTxt, { fontSize: t.xs, color: c.textMuted }]} accessible={false}>Жүктелуде...</Text>
          </View>
        )}
        <Slider
          style={[s.slider, (loading || isBuffering) && s.sliderDisabled]}
          minimumValue={0}
          maximumValue={duration || 1}
          value={isSeeking ? sliderPosition : position}
          minimumTrackTintColor={loading || isBuffering ? colors.borderSoft : colors.primary}
          maximumTrackTintColor={colors.borderSoft}
          thumbTintColor={loading || isBuffering ? colors.borderSoft : colors.primary}
          disabled={loading || isBuffering}
          onSlidingStart={() => setIsSeeking(true)}
          onValueChange={(v) => setSliderPosition(v)}
          onSlidingComplete={async (v) => { setIsSeeking(false); await audioService.seekTo(v); }}
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel={`Позиция: ${formatTimeVoice(position)} из ${formatTimeVoice(duration)}`}
          accessibilityHint="Проведите вверх или вниз для перемотки"
        />
        <View style={s.timeRow} accessible={false}>
          <Text style={[s.timeText, { fontSize: t.sm, color: c.textMuted }]} accessible={false}>{formatTime(position)}</Text>
          <Text style={[s.timeText, { fontSize: t.sm, color: c.textMuted }]} accessible={false}>−{formatTime(Math.max(0, duration - position))}</Text>
        </View>
      </View>

      {/* ±SEEK_STEP_SECONDS секунд */}
      <View style={s.seekRow} accessible={false}>
        <TouchableOpacity
          style={s.seekBtn}
          onPress={seekBackward}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Назад ${SEEK_STEP_SECONDS} секунд`}
          accessibilityHint={`Дважды нажмите для перемотки назад на ${SEEK_STEP_SECONDS} секунд`}
          hitSlop={interaction.hitSlopStd}
        >
          <Icon name="play-back" size={18} color={c.textMuted} />
          <Text style={[s.seekBtnTxt, { fontSize: t.sm, color: c.textMuted }]} accessible={false}>{SEEK_STEP_SECONDS}с</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.seekBtn}
          onPress={seekForward}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Вперёд ${SEEK_STEP_SECONDS} секунд`}
          accessibilityHint={`Дважды нажмите для перемотки вперёд на ${SEEK_STEP_SECONDS} секунд`}
          hitSlop={interaction.hitSlopStd}
        >
          <Text style={[s.seekBtnTxt, { fontSize: t.sm, color: c.textMuted }]} accessible={false}>{SEEK_STEP_SECONDS}с</Text>
          <Icon name="play-forward" size={18} color={c.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Главные кнопки */}
      <View style={s.controls} accessible={false}>
        <TouchableOpacity
          style={[s.ctrlBtn, chapterIndex === 0 && s.disabled]}
          onPress={skipPrev}
          disabled={chapterIndex === 0}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Предыдущая глава"
          accessibilityHint="Дважды нажмите для перехода к предыдущей главе"
          accessibilityState={{ disabled: chapterIndex === 0 }}
          hitSlop={interaction.hitSlopStd}
        >
          <Icon name="play-skip-back" size={32} color={chapterIndex === 0 ? colors.borderLight : colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.playBtn, loading && s.playBtnDisabled]}
          onPress={togglePlay}
          disabled={loading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Пауза' : 'Воспроизвести'}
          accessibilityHint={isPlaying ? 'Дважды нажмите для паузы' : 'Дважды нажмите для воспроизведения'}
          accessibilityState={{ disabled: loading }}
        >
          {loading
            ? <ActivityIndicator color="#fff" accessible={false} />
            : <Icon name={isPlaying ? 'pause' : 'play'} size={36} color="#fff" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.ctrlBtn, chapterIndex >= chapters.length - 1 && s.disabled]}
          onPress={skipNext}
          disabled={chapterIndex >= chapters.length - 1}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Следующая глава"
          accessibilityHint="Дважды нажмите для перехода к следующей главе"
          accessibilityState={{ disabled: chapterIndex >= chapters.length - 1 }}
          hitSlop={interaction.hitSlopStd}
        >
          <Icon name="play-skip-forward" size={32} color={chapterIndex >= chapters.length - 1 ? colors.borderLight : colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Модальный список глав */}
      <Modal
        visible={showChapterList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChapterList(false)}
        accessible={false}
      >
        <View style={s.modalContainer} accessibilityViewIsModal={true}>
          <View style={s.modalHeader}>
            <Text
              style={[s.modalTitle, { fontSize: t.xl, color: c.textPrimary }]}
              accessible={true}
              accessibilityRole="header"
            >
              Тараулар
            </Text>
            <TouchableOpacity
              style={s.modalClose}
              onPress={() => setShowChapterList(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Закрыть список глав"
              accessibilityHint="Дважды нажмите для закрытия"
              hitSlop={interaction.hitSlopStd}
            >
              <Icon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={chapters}
            keyExtractor={c2 => c2.id}
            renderItem={renderChapterItem}
            initialScrollIndex={Math.max(0, chapterIndex)}
            getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Оверлей перехода между главами */}
      {advancingChapter ? (
        <Animated.View
          style={[s.advanceOverlay, { opacity: advanceOverlayOpacity }]}
          accessible={false}
          pointerEvents="none"
        >
          <ActivityIndicator color={colors.primary} accessible={false} />
          <Text style={s.advanceTxt} accessible={false}>Келесі тарау...</Text>
        </Animated.View>
      ) : null}

      {/* Нижняя панель */}
      <View style={s.bottomRow} accessible={false}>
        <TouchableOpacity
          style={s.pill}
          onPress={cycleSpeed}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Скорость: ${Math.round(speed * 100)} процентов`}
          accessibilityHint="Дважды нажмите для изменения скорости"
          hitSlop={interaction.hitSlopSmall}
        >
          <Icon name="speedometer-outline" size={15} color={colors.textMuted} />
          <Text style={[s.pillTxt, { fontSize: t.md, color: c.textSecondary }]} accessible={false}>{Math.round(speed * 100)}%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.pill}
          onPress={() => setShowChapterList(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Список глав: ${chapters.length}`}
          accessibilityHint="Дважды нажмите для выбора главы"
          hitSlop={interaction.hitSlopSmall}
        >
          <Icon name="list-outline" size={15} color={colors.textMuted} />
          <Text style={[s.pillTxt, { fontSize: t.md, color: c.textSecondary }]} accessible={false}>Тараулар</Text>
        </TouchableOpacity>

        {isDownloaded && (
          <View style={s.offlineBadge} accessible={false}>
            <Icon name="cloud-done" size={13} color={colors.success} />
            <Text style={s.offlineTxt} accessible={false}>Офлайн</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.pill, isDownloaded && s.pillDone]}
          onPress={handleDownloadChapter}
          disabled={isDownloading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isDownloading
              ? `Загрузка: ${downloadProgress} процентов`
              : isDownloaded
                ? 'Глава загружена, нажмите для удаления'
                : 'Скачать главу'
          }
          accessibilityHint={
            isDownloading ? 'Подождите' : isDownloaded ? 'Дважды нажмите для удаления' : 'Дважды нажмите для скачивания'
          }
          accessibilityState={{ disabled: isDownloading }}
        >
          {isDownloading
            ? (
              <View style={s.dlContent} accessible={false}>
                <ActivityIndicator size="small" color={colors.primary} accessible={false} />
                <Text style={s.dlPct} accessible={false}>{downloadProgress}%</Text>
              </View>
            )
            : isDownloaded
              ? <Icon name="checkmark-circle" size={20} color={colors.success} />
              : <Icon name="cloud-download-outline" size={20} color={colors.textMuted} />
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCard },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  center: {
    flex: 1,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingTxt: { fontSize: typography.md, color: colors.textMuted },
  errorText: {
    fontSize: typography.md,
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    minHeight: a11y.minTouchTargetSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textOnPrimary,
  },

  infoBlock: { alignItems: 'center', width: '100%', marginBottom: spacing.xl },
  coverShadowWrap: {
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: spacing.xl,
    borderRadius: radii.xxl,
  },
  cover: {
    width: 200,
    height: 264,
    borderRadius: radii.xxl,
  },
  coverPh: {
    width: 200,
    height: 264,
    borderRadius: radii.xxl,
    backgroundColor: colors.bgMain,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  author: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontWeight: typography.medium,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bookTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: spacing.xs,
  },
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  narrator: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  chapterBadge: {
    alignItems: 'center',
    backgroundColor: colors.bgMain,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  chLabel: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.semibold,
    textAlign: 'center',
  },
  chCount: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  sliderSection: { width: '100%', marginBottom: spacing.sm },
  slider: { width: '100%', height: a11y.sliderMinHeight },
  sliderDisabled: { opacity: 0.4 },
  bufferingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  bufferingTxt: { fontSize: typography.xs, color: colors.textMuted },

  modalContainer: {
    flex: 1,
    backgroundColor: colors.bgCard,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    minHeight: a11y.minTouchTarget,
  },
  modalTitle: {
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  modalClose: {
    width: a11y.minTouchTargetSmall,
    height: a11y.minTouchTargetSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: spacing.md,
  },
  chRowActive: { backgroundColor: colors.primarySoft },
  chRowLeft: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chNum: { fontWeight: typography.medium },
  chRowInfo: { flex: 1 },
  chRowTitle: { fontWeight: typography.medium, lineHeight: 22 },
  chRowDur: { marginTop: spacing.micro },

  advanceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 10,
  },
  advanceTxt: {
    fontSize: typography.md,
    color: colors.textMuted,
    fontWeight: typography.medium,
  },

  resumeToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.textSecondary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  resumeToastTxt: {
    fontSize: typography.sm,
    color: colors.textOnPrimary,
    fontWeight: typography.medium,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: { fontSize: typography.sm, color: colors.textMuted, fontWeight: typography.medium },

  seekRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  seekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 80,
    minHeight: a11y.minTouchTargetSmall,
    justifyContent: 'center',
    backgroundColor: colors.bgMain,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  seekBtnTxt: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textMuted,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    marginBottom: spacing.xl,
  },
  ctrlBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.3 },
  playBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  playBtnDisabled: { opacity: 0.55 },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: a11y.minTouchTargetSmall,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgMain,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pillDone: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successBorder,
  },
  pillTxt: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  offlineTxt: {
    fontSize: typography.sm,
    color: colors.success,
    fontWeight: typography.semibold,
  },
  dlContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dlPct: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
});
