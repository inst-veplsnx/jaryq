import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Chapter } from '../types';
import { bookService } from '../services/bookService';
import { useAuthStore } from '../store/authStore';
import { useDownloadStore } from '../store/downloadStore';
import { useCoverSource } from '../hooks/useCoverSource';
import AccessibleButton from '../components/AccessibleButton';
import Icon from '../components/Icon';
import { formatTime, formatTimeVoice, announceForAccessibility } from '../utils/accessibility';
import { colors, typography, radii, spacing, a11y, shadows } from '../theme/designTokens';

type Nav = StackNavigationProp<HomeStackParamList, 'BookDetail'>;
type Route = RouteProp<HomeStackParamList, 'BookDetail'>;

export default function BookDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params: { book } } = useRoute<Route>();
  const { user } = useAuthStore();
  const downloadChapter     = useDownloadStore(s => s.downloadChapter);
  const downloadAllChapters = useDownloadStore(s => s.downloadAllChapters);
  const isChapterDownloaded = useDownloadStore(s => s.isChapterDownloaded);
  const deleteBookDownloads = useDownloadStore(s => s.deleteBookDownloads);
  const deleteChapter       = useDownloadStore(s => s.deleteChapter);
  const downloads           = useDownloadStore(s => s.downloads);
  const downloadedChapters  = useDownloadStore(s => s.downloadedChapters);

  const coverSource = useCoverSource(book);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [savedProgress, setSaved] = useState<{ chapter: number; position: number } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);

    Promise.all([
      bookService.getChapters(book.id),
      user ? bookService.isFavorite(user.id, book.id) : Promise.resolve(false),
      user ? bookService.getProgress(user.id, book.id) : Promise.resolve(null),
    ]).then(([chs, fav, prog]) => {
      if (cancelled) return;
      setChapters(chs);
      setIsFav(fav as boolean);
      if (prog) setSaved({ chapter: prog.chapter_number, position: prog.position });
      setLoadingData(false);
    }).catch(() => {
      if (!cancelled) {
        setLoadError(true);
        setLoadingData(false);
      }
    });

    return () => { cancelled = true; };
  }, [book.id, user?.id]);

  const toggleFav = async () => {
    if (!user) return;
    setFavLoading(true);
    try {
      if (isFav) {
        await bookService.removeFavorite(user.id, book.id);
        setIsFav(false);
        announceForAccessibility('Удалено из избранного');
      } else {
        await bookService.addFavorite(user.id, book.id);
        setIsFav(true);
        announceForAccessibility('Добавлено в избранное');
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось обновить избранное. Попробуйте ещё раз.');
    } finally {
      setFavLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (chapters.length === 0) return;

    const downloadedCount = chapters.filter(ch => isChapterDownloaded(book.id, ch.id)).length;
    if (downloadedCount === chapters.length) {
      Alert.alert(
        'Удалить все загрузки',
        `Удалить все ${chapters.length} загруженных глав этой книги?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: async () => {
              await deleteBookDownloads(book.id);
              announceForAccessibility('Все загрузки удалены');
            },
          },
        ],
      );
      return;
    }

    setDownloadingAll(true);
    announceForAccessibility(`Начало загрузки всех глав: ${chapters.length}`);
    await downloadAllChapters(chapters, book);
    setDownloadingAll(false);
    announceForAccessibility('Загрузка всех глав завершена');
  };

  const handleDownloadChapter = async (chapter: Chapter) => {
    const downloaded = isChapterDownloaded(book.id, chapter.id);
    if (downloaded) {
      Alert.alert(
        'Удалить главу',
        `Удалить «${chapter.title || `Глава ${chapter.chapter_number}`}»?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: async () => {
              await deleteChapter(book.id, chapter.id);
              announceForAccessibility('Загрузка главы удалена');
            },
          },
        ],
      );
    } else {
      announceForAccessibility(`Начало загрузки главы ${chapter.chapter_number}`);
      try {
        await downloadChapter(chapter, book);
        announceForAccessibility(`Глава ${chapter.chapter_number} загружена`);
      } catch {
        announceForAccessibility('Ошибка загрузки главы');
      }
    }
  };

  const { downloadedCount, downloadPercent, allDownloaded } = useMemo(() => {
    const chaptersForBook = downloadedChapters[book.id] || [];
    const count = chapters.filter(ch => chaptersForBook.includes(ch.id)).length;
    const pct = chapters.length > 0 ? Math.round((count / chapters.length) * 100) : 0;
    return { downloadedCount: count, downloadPercent: pct, allDownloaded: chapters.length > 0 && count === chapters.length };
  }, [chapters, downloadedChapters, book.id]);

  const a11yHeader = useMemo(() => [
    `${book.author} — ${book.title}`,
    book.narrator ? `Читает ${book.narrator}` : null,
    book.total_duration ? `Длительность ${formatTimeVoice(book.total_duration)}` : null,
    book.total_chapters ? `${book.total_chapters} глав` : null,
    book.genre?.name ? `Жанр: ${book.genre.name}` : null,
    allDownloaded ? 'Все главы доступны офлайн' : downloadPercent > 0 ? `Загружено ${downloadPercent} процентов глав` : null,
  ].filter(Boolean).join('. '), [book, allDownloaded, downloadPercent]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Герой: обложка + мета */}
      <View
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={a11yHeader}
        style={s.hero}
      >
        {/* Обложка */}
        <View style={s.coverWrap} accessible={false}>
          {coverSource
            ? <Image source={coverSource} style={s.coverImg} accessible={false} />
            : (
              <View style={s.coverPh} accessible={false}>
                <Icon name="book-outline" size={44} color={colors.textPlaceholder} />
              </View>
            )}
        </View>

        {/* Мета справа */}
        <View style={s.meta} accessible={false}>
          <Text style={s.author} accessible={false}>{book.author}</Text>
          <Text style={s.bookTitle} accessible={false}>{book.title}</Text>

          {book.narrator ? (
            <View style={s.narratorRow} accessible={false}>
              <Icon name="mic-outline" size={12} color={colors.textMuted} />
              <Text style={s.narrator} accessible={false}> {book.narrator}</Text>
            </View>
          ) : null}

          <View style={s.badges} accessible={false}>
            {book.genre?.name ? (
              <View style={s.genreBadge} accessible={false}>
                <Text style={s.genreTxt} accessible={false}>{book.genre.name}</Text>
              </View>
            ) : null}
          </View>

          {book.total_duration ? (
            <View style={s.durRow} accessible={false}>
              <Icon name="time-outline" size={13} color={colors.textMuted} />
              <Text style={s.durTxt} accessible={false}> {formatTime(book.total_duration)}</Text>
            </View>
          ) : null}

          {downloadPercent > 0 && !allDownloaded && (
            <View style={s.dlProgress} accessible={false}>
              <View style={s.dlTrack} accessible={false}>
                <View style={[s.dlFill, { width: `${downloadPercent}%` }]} accessible={false} />
              </View>
              <Text style={s.dlTxt} accessible={false}>{downloadPercent}% офлайн</Text>
            </View>
          )}
          {allDownloaded && (
            <View style={s.offlineRow} accessible={false}>
              <Icon name="cloud-done" size={13} color={colors.success} />
              <Text style={s.offlineTxt} accessible={false}> Офлайн</Text>
            </View>
          )}
        </View>
      </View>

      {/* Описание */}
      {book.description ? (
        <View style={s.section}>
          <Text style={s.sectionTitle} accessible={true} accessibilityRole="header">
            Сипаттама
          </Text>
          <Text
            style={s.desc}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`Описание: ${book.description}`}
          >
            {book.description}
          </Text>
        </View>
      ) : null}

      {/* Кнопки действий */}
      <View style={s.actions}>
        {/* Главная кнопка воспроизведения */}
        <AccessibleButton
          label={savedProgress ? `${savedProgress.chapter}-тараудан жалғастыру` : 'Басынан тыңдау'}
          a11yLabel={savedProgress ? `Продолжить с главы ${savedProgress.chapter}` : 'Слушать с начала'}
          hint={savedProgress ? 'Продолжить прослушивание' : 'Начать с первой главы'}
          onPress={() => nav.navigate('Player', {
            book,
            chapterIndex: savedProgress ? savedProgress.chapter - 1 : 0,
          })}
          style={s.playBtn}
        />

        {/* Если есть прогресс — кнопка "с начала" второй строкой */}
        {savedProgress ? (
          <AccessibleButton
            label="Басынан тыңдау"
            a11yLabel="Слушать с начала"
            hint="Начать прослушивание с первой главы"
            onPress={() => nav.navigate('Player', { book, chapterIndex: 0 })}
            variant="secondary"
            style={s.actionBtn}
          />
        ) : null}

        {/* Строка иконок: избранное + скачать */}
        <View style={s.iconRow} accessible={false}>
          <TouchableOpacity
            style={[s.iconBtn, isFav && s.iconBtnActive]}
            onPress={toggleFav}
            disabled={favLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
            accessibilityHint={isFav ? 'Дважды нажмите для удаления' : 'Дважды нажмите для добавления'}
            accessibilityState={{ selected: isFav }}
            activeOpacity={0.7}
          >
            {favLoading
              ? <ActivityIndicator size="small" color={isFav ? colors.primary : colors.textMuted} accessible={false} />
              : <Icon name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.primary : colors.textMuted} />
            }
            <Text style={[s.iconBtnLabel, isFav && s.iconBtnLabelActive]} accessible={false}>
              {isFav ? 'Таңдаулыда' : 'Таңдау'}
            </Text>
          </TouchableOpacity>

          {chapters.length > 0 && (
            <TouchableOpacity
              style={[s.iconBtn, allDownloaded && s.iconBtnDone]}
              onPress={handleDownloadAll}
              disabled={downloadingAll}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                allDownloaded
                  ? 'Все главы загружены, нажмите для удаления'
                  : downloadingAll
                    ? `Загрузка: ${downloadedCount} из ${chapters.length}`
                    : `Скачать все ${chapters.length} глав`
              }
              accessibilityHint={allDownloaded ? 'Дважды нажмите для удаления' : 'Дважды нажмите для скачивания'}
              accessibilityState={{ disabled: downloadingAll }}
              activeOpacity={0.7}
            >
              {downloadingAll
                ? <ActivityIndicator size="small" color={colors.primary} accessible={false} />
                : <Icon
                    name={allDownloaded ? 'checkmark-circle' : 'cloud-download-outline'}
                    size={22}
                    color={allDownloaded ? colors.success : colors.textMuted}
                  />
              }
              <Text style={[s.iconBtnLabel, allDownloaded && s.iconBtnLabelDone]} accessible={false}>
                {allDownloaded
                  ? 'Жүктелді'
                  : downloadingAll
                    ? `${downloadedCount}/${chapters.length}`
                    : 'Барлығын жүктеу'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Список глав */}
      <View style={s.section}>
        <Text
          style={s.sectionTitle}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel={`Список глав, всего ${chapters.length}`}
        >
          Тараулар ({chapters.length})
        </Text>

        {loadingData ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: spacing.md }}
            accessible={true}
            accessibilityLabel="Загрузка глав..."
          />
        ) : loadError ? (
          <Text
            style={[s.desc, { color: colors.error }]}
            accessible={true}
            accessibilityRole="alert"
          >
            Деректерді жүктеу сәтсіз аяқталды. Байланысты тексеріп, қайталап көріңіз.
          </Text>
        ) : (
          chapters.map(ch => {
            const downloaded = isChapterDownloaded(book.id, ch.id);
            const downloadKey = `${book.id}-${ch.id}`;
            const dlInfo = downloads[downloadKey];
            const isDownloading = dlInfo?.status === 'downloading';
            const dlProgress = dlInfo?.progress || 0;
            const isCurrentChapter = savedProgress?.chapter === ch.chapter_number;

            return (
              <View key={ch.id} style={[s.chapterWrap, isCurrentChapter && s.chapterWrapActive]}>
                <TouchableOpacity
                  style={s.chapterRow}
                  onPress={() => nav.navigate('Player', { book, chapterIndex: ch.chapter_number - 1 })}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Глава ${ch.chapter_number}${ch.title ? ': ' + ch.title : ''}. ${formatTimeVoice(ch.duration)}. ${downloaded ? 'Доступно офлайн' : 'Требуется интернет'}`}
                  accessibilityHint="Дважды нажмите для воспроизведения"
                  accessibilityState={{ selected: isCurrentChapter }}
                  activeOpacity={0.7}
                >
                  {/* Номер главы */}
                  <View style={[s.chNumWrap, isCurrentChapter && s.chNumActive]} accessible={false}>
                    {isCurrentChapter
                      ? <Icon name="play" size={14} color={colors.primary} />
                      : <Text style={s.chNum} accessible={false}>{ch.chapter_number}</Text>}
                  </View>

                  {/* Текст */}
                  <View style={s.chInfo} accessible={false}>
                    <Text
                      style={[s.chTitle, isCurrentChapter && s.chTitleActive]}
                      accessible={false}
                      numberOfLines={2}
                    >
                      {ch.title || `Тарау ${ch.chapter_number}`}
                    </Text>
                    <View style={s.chMeta} accessible={false}>
                      <Icon name="time-outline" size={11} color={colors.textMuted} />
                      <Text style={s.chDur} accessible={false}> {formatTime(ch.duration)}</Text>
                      {downloaded && (
                        <>
                          <Text style={s.chDur} accessible={false}> · </Text>
                          <Icon name="cloud-done" size={11} color={colors.success} />
                        </>
                      )}
                    </View>
                  </View>

                  {/* Кнопка загрузки */}
                  <TouchableOpacity
                    style={[s.chDownloadBtn, downloaded && s.chDownloadBtnDone]}
                    onPress={() => handleDownloadChapter(ch)}
                    disabled={isDownloading}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isDownloading
                        ? `Загрузка: ${dlProgress} процентов`
                        : downloaded
                          ? 'Глава загружена, нажмите для удаления'
                          : 'Скачать главу для офлайн-прослушивания'
                    }
                    accessibilityHint={
                      isDownloading
                        ? 'Пожалуйста подождите'
                        : downloaded
                          ? 'Дважды нажмите для удаления'
                          : 'Дважды нажмите для скачивания'
                    }
                    accessibilityState={{ disabled: isDownloading }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isDownloading
                      ? (
                        <View style={s.dlBtnContent} accessible={false}>
                          <ActivityIndicator size="small" color={colors.primary} accessible={false} />
                          <Text style={s.dlBtnPct} accessible={false}>{dlProgress}%</Text>
                        </View>
                      )
                      : downloaded
                        ? <Icon name="checkmark-circle" size={22} color={colors.success} />
                        : <Icon name="cloud-download-outline" size={22} color={colors.primaryLight} />
                    }
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },

  // Герой
  hero: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  coverWrap: {
    width: 116,
    height: 148,
    borderRadius: radii.lg,
    overflow: 'hidden',
    flexShrink: 0,
    ...shadows.md,
  },
  coverImg: { width: '100%', height: '100%' },
  coverPh: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgMain,
  },
  meta: { flex: 1, justifyContent: 'center' },
  author: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: typography.medium,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    lineHeight: 27,
    marginBottom: spacing.xs,
  },
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  narrator: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  genreBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  genreTxt: { fontSize: typography.xs, color: colors.primary, fontWeight: typography.semibold },
  durRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  durTxt: { fontSize: typography.sm, color: colors.textMuted },
  dlProgress: { marginTop: spacing.xs },
  dlTrack: { height: 3, backgroundColor: colors.borderSoft, borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  dlFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  dlTxt: { fontSize: typography.xs, color: colors.primary, fontWeight: typography.medium },
  offlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  offlineTxt: { fontSize: typography.xs, color: colors.success, fontWeight: typography.semibold },

  // Секции
  section: {
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  desc: {
    fontSize: typography.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // Кнопки
  actions: {
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  playBtn: {},
  actionBtn: {},
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  iconBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    backgroundColor: colors.bgMain,
    minHeight: a11y.minTouchTarget,
  },
  iconBtnActive: {
    borderColor: colors.primaryMed,
    backgroundColor: colors.primarySoft,
  },
  iconBtnDone: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successSoft,
  },
  iconBtnLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textMuted,
  },
  iconBtnLabelActive: { color: colors.primary },
  iconBtnLabelDone: { color: colors.success },

  // Главы
  chapterWrap: {
    borderRadius: radii.md,
    marginBottom: spacing.xxs,
    overflow: 'hidden',
  },
  chapterWrapActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: 64,
    gap: spacing.sm,
  },
  chNumWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chNumActive: { backgroundColor: colors.primarySoft },
  chNum: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.textMuted },
  chInfo: { flex: 1 },
  chTitle: {
    fontSize: typography.md,
    color: colors.textPrimary,
    fontWeight: typography.medium,
    lineHeight: 20,
  },
  chTitleActive: { color: colors.primary, fontWeight: typography.semibold },
  chMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  chDur: { fontSize: typography.xs, color: colors.textMuted },
  chDownloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chDownloadBtnDone: { backgroundColor: colors.successSoft },
  dlBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dlBtnPct: { fontSize: typography.xs, color: colors.primary, fontWeight: typography.bold },
});
