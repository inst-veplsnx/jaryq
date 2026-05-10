import React, { useRef } from 'react';
import { Pressable, View, Text, StyleSheet, Image, Animated } from 'react-native';
import { Book } from '../types';
import { formatTime, formatTimeVoice } from '../utils/accessibility';
import { colors, radii, spacing, shadows } from '../theme/designTokens';
import { useAppScale } from '../theme/useAppScale';
import Icon from './Icon';
import { useCoverSource } from '../hooks/useCoverSource';

interface Props {
  book: Book;
  onPress: (book: Book) => void;
  progressChapter?: number;
}

const BookListItem: React.FC<Props> = React.memo(({ book, onPress, progressChapter }) => {
  const { t, c } = useAppScale();
  const coverSource = useCoverSource(book);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, {
    toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 3,
  }).start();

  const onPressOut = () => Animated.spring(scale, {
    toValue: 1, useNativeDriver: true, speed: 40, bounciness: 5,
  }).start();

  const a11yLabel = [
    `${book.author} — ${book.title}`,
    book.narrator ? `Читает ${book.narrator}` : null,
    book.total_duration ? `Длительность ${formatTimeVoice(book.total_duration)}` : null,
    progressChapter
      ? `Остановились на главе ${progressChapter} из ${book.total_chapters}`
      : null,
  ]
    .filter(Boolean)
    .join('. ');

  const progress = progressChapter && book.total_chapters
    ? progressChapter / book.total_chapters
    : 0;

  return (
    <Pressable
      onPress={() => onPress(book)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Дважды нажмите, чтобы открыть книгу"
    >
    <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
      {/* Обложка */}
      <View style={styles.coverWrap} accessible={false}>
        {coverSource ? (
          <Image source={coverSource} style={styles.coverImg} accessible={false} />
        ) : (
          <View style={styles.coverPh} accessible={false}>
            <Icon name="book-outline" size={32} color={colors.textPlaceholder} />
          </View>
        )}
      </View>

      {/* Информация */}
      <View style={styles.info} accessible={false}>
        <Text style={[styles.author, { fontSize: t.xs, color: c.textMuted }]} accessible={false} numberOfLines={1}>
          {book.author}
        </Text>
        <Text style={[styles.title, { fontSize: t.md, color: c.textPrimary }]} accessible={false} numberOfLines={2}>
          {book.title}
        </Text>

        {book.narrator ? (
          <View style={styles.narratorRow} accessible={false}>
            <Icon name="mic-outline" size={13} color={c.textMuted} />
            <Text style={[styles.narrator, { fontSize: t.xs, color: c.textMuted }]} accessible={false} numberOfLines={1}>
              {' '}{book.narrator}
            </Text>
          </View>
        ) : null}

        <View style={styles.meta} accessible={false}>
          {book.total_duration ? (
            <View style={styles.metaBadge} accessible={false}>
              <Icon name="time-outline" size={13} color={c.textMuted} />
              <Text style={[styles.metaTxt, { fontSize: t.xs, color: c.textMuted }]} accessible={false}>
                {' '}{formatTime(book.total_duration)}
              </Text>
            </View>
          ) : null}
          {book.language && book.language !== 'ru' ? (
            <View style={styles.langBadge} accessible={false}>
              <Text style={[styles.langTxt, { fontSize: t.xs }]} accessible={false}>
                {book.language.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        {progress > 0 ? (
          <View style={styles.progressSection} accessible={false}>
            <View style={styles.progressTrack} accessible={false}>
              <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
            </View>
            <Text style={[styles.progressTxt, { fontSize: t.xs }]} accessible={false}>
              Тарау {progressChapter}/{book.total_chapters}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.arrow} accessible={false}>
        <Icon name="chevron-forward" size={20} color={colors.borderLight} />
      </View>
    </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    minHeight: 100,
  },
  coverWrap: {
    width: 72,
    height: 96,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    backgroundColor: colors.bgMain,
    flexShrink: 0,
    ...shadows.sm,
  },
  coverImg: { width: '100%', height: '100%' },
  coverPh: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgMain,
  },
  info: { flex: 1 },
  author: {
    fontWeight: '500',
    marginBottom: spacing.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  title: {
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: spacing.xxs,
  },
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  narrator: { fontStyle: 'italic' },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  metaBadge: { flexDirection: 'row', alignItems: 'center' },
  metaTxt: {},
  langBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  langTxt: { color: colors.primary, fontWeight: '700' },
  progressSection: { marginTop: spacing.xs },
  progressTrack: {
    height: 3,
    backgroundColor: colors.borderSoft,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.micro,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressTxt: { color: colors.primary, fontWeight: '600' },
  arrow: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default BookListItem;
