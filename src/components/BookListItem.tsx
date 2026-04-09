import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { Book } from '../types';
import { formatTime, formatTimeVoice } from '../utils/accessibility';

interface Props {
  book: Book;
  onPress: (book: Book) => void;
  progressChapter?: number;
}

const BookListItem: React.FC<Props> = ({ book, onPress, progressChapter }) => {
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

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(book)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Дважды нажмите, чтобы открыть книгу"
    >
      <View style={styles.cover} accessible={false}>
        {book.cover_url ? (
          <Image
            source={{ uri: book.cover_url }}
            style={styles.coverImg}
            accessible={false}
          />
        ) : (
          <View style={styles.coverPh}>
            <Text accessible={false} style={styles.coverIcon}>📖</Text>
          </View>
        )}
      </View>

      <View style={styles.info} accessible={false}>
        <Text style={styles.author} accessible={false} numberOfLines={1}>
          {book.author}
        </Text>
        <Text style={styles.title} accessible={false} numberOfLines={2}>
          {book.title}
        </Text>
        {book.narrator ? (
          <Text style={styles.narrator} accessible={false} numberOfLines={1}>
            {book.narrator}
          </Text>
        ) : null}
        <View style={styles.meta} accessible={false}>
          {book.total_duration ? (
            <Text style={styles.dur} accessible={false}>
              {formatTime(book.total_duration)}
            </Text>
          ) : null}
          {book.language && book.language !== 'ru' ? (
            <View style={styles.lang}>
              <Text style={styles.langT} accessible={false}>
                {book.language.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
        {progressChapter && book.total_chapters ? (
          <View style={styles.progressBar} accessible={false}>
            <View
              style={[
                styles.progressFill,
                { width: `${(progressChapter / book.total_chapters) * 100}%` },
              ]}
              accessible={false}
            />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    minHeight: 80,
  },
  cover: {
    width: 56,
    height: 70,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: '#F3F4F6',
    flexShrink: 0,
  },
  coverImg: { width: '100%', height: '100%' },
  coverPh: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverIcon: { fontSize: 28 },
  info: { flex: 1 },
  author: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 2 },
  title: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 3,
  },
  narrator: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dur: { fontSize: 12, color: '#6B7280' },
  lang: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  langT: { fontSize: 10, color: '#2563EB', fontWeight: '700' },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
});

export default BookListItem;