import * as FileSystem from 'expo-file-system';
import { Chapter, Book } from '../types';

/** Статус загрузки */
export type DownloadStatus =
  | 'idle'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error';

/** Информация о загрузке */
export interface DownloadInfo {
  status: DownloadStatus;
  progress: number; // 0-100
  error?: string;
  localUri?: string;
}

/** Ключ для главы: bookId-chapterId */
const getChapterKey = (bookId: string, chapterId: string): string =>
  `${bookId}-${chapterId}`;

/** Получить путь директории для книги */
const getBookDir = (): string => `${FileSystem.documentDirectory}audio/`;

/** Получить путь файла для главы */
const getChapterFilePath = (bookId: string, chapterId: string): string =>
  `${getBookDir()}${bookId}/${chapterId}.m4a`;

/** Получить путь файла для главы из метаданных */
const getChapterFilePathFromMeta = (meta: ChapterDownloadMeta): string =>
  `${getBookDir()}${meta.bookId}/${meta.chapterId}.m4a`;

/** Метаданные загруженной главы */
export interface ChapterDownloadMeta {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
}

/** Метаданные книги с загруженными главами */
export interface BookDownloadMeta {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverUrl?: string;
  chapters: ChapterDownloadMeta[];
  downloadedAt: string;
}

const BOOKS_META_FILE = `${getBookDir()}books_meta.json`;

/** Проверить, существует ли директория книги */
const ensureBookDirExists = async (bookId: string): Promise<void> => {
  const dir = `${getBookDir()}${bookId}/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

/** Получить локальный URI главы, если она загружена */
export const getLocalChapterUri = async (
  bookId: string,
  chapterId: string,
): Promise<string | null> => {
  const uri = getChapterFilePath(bookId, chapterId);
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? uri : null;
};

/** Проверить, загружена ли глава */
export const isChapterDownloaded = async (
  bookId: string,
  chapterId: string,
): Promise<boolean> => {
  const uri = await getLocalChapterUri(bookId, chapterId);
  return uri !== null;
};

/** Проверить, какие главы загружены */
export const getDownloadedChapters = async (
  bookId: string,
): Promise<string[]> => {
  const bookDir = `${getBookDir()}${bookId}/`;
  const dirInfo = await FileSystem.getInfoAsync(bookDir);

  if (!dirInfo.exists) return [];

  const files = await FileSystem.readDirectoryAsync(bookDir);
  return files
    .filter((f) => f.endsWith('.m4a'))
    .map((f) => f.replace('.m4a', ''));
};

/** Получить все загруженные книги */
export const getAllDownloadedBooks = async (): Promise<BookDownloadMeta[]> => {
  try {
    const rootDir = getBookDir();
    const rootInfo = await FileSystem.getInfoAsync(rootDir);

    if (!rootInfo.exists) return [];

    const items = await FileSystem.readDirectoryAsync(rootDir);
    const bookDirs = items.filter((item) => item !== 'books_meta.json');

    const books: BookDownloadMeta[] = [];

    for (const bookId of bookDirs) {
      const bookDir = `${rootDir}${bookId}/`;
      const dirInfo = await FileSystem.getInfoAsync(bookDir);

      if (!dirInfo.exists || !dirInfo.isDirectory) continue;

      const files = await FileSystem.readDirectoryAsync(bookDir);
      const chapterIds = files
        .filter((f) => f.endsWith('.m4a'))
        .map((f) => f.replace('.m4a', ''));

      if (chapterIds.length > 0) {
        // Попробуем загрузить метаданные из файла
        const metaFile = `${rootDir}books_meta.json`;
        const metaExists = await FileSystem.getInfoAsync(metaFile);

        if (metaExists.exists) {
          try {
            const content = await FileSystem.readAsStringAsync(metaFile);
            const allMeta: BookDownloadMeta[] = JSON.parse(content);
            const bookMeta = allMeta.find((m) => m.bookId === bookId);
            if (bookMeta) {
              books.push(bookMeta);
              continue;
            }
          } catch (e) {
            // Игнорируем ошибки парсинга
          }
        }

        // Если метаданных нет — создаем базовые
        books.push({
          bookId,
          bookTitle: `Книга ${bookId.slice(0, 8)}`,
          bookAuthor: 'Неизвестный автор',
          chapters: chapterIds.map((chId) => ({
            bookId,
            bookTitle: `Книга ${bookId.slice(0, 8)}`,
            bookAuthor: 'Неизвестный автор',
            chapterId: chId,
            chapterNumber: 0,
            chapterTitle: chId,
          })),
          downloadedAt: '',
        });
      }
    }

    return books;
  } catch (error) {
    console.error('Error getting downloaded books:', error);
    return [];
  }
};

/** Удалить загруженную главу */
export const deleteChapter = async (
  bookId: string,
  chapterId: string,
): Promise<void> => {
  const uri = getChapterFilePath(bookId, chapterId);
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri);
  }
};

/** Удалить все загруженные книги */
export const deleteAllDownloads = async (): Promise<void> => {
  const bookDir = getBookDir();
  const info = await FileSystem.getInfoAsync(bookDir);
  if (info.exists) {
    await FileSystem.deleteAsync(bookDir);
    await FileSystem.makeDirectoryAsync(bookDir, { intermediates: true });
  }
};

/** Удалить одну книгу (все её главы) */
export const deleteBookDownloads = async (bookId: string): Promise<void> => {
  const bookDir = `${getBookDir()}${bookId}/`;
  const info = await FileSystem.getInfoAsync(bookDir);
  if (info.exists) {
    await FileSystem.deleteAsync(bookDir);
  }
  await removeBookFromMetadata(bookId);
};

/** Получить путь файла для обложки книги */
const getCoverFilePath = (bookId: string): string =>
  `${getBookDir()}${bookId}/cover.jpg`;

/** Скачать обложку книги и сохранить локально */
export const downloadBookCover = async (book: Book): Promise<string | null> => {
  if (!book.cover_url) return null;
  try {
    await ensureBookDirExists(book.id);
    const path = getCoverFilePath(book.id);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return path;
    const result = await FileSystem.downloadAsync(book.cover_url, path);
    return result?.uri || null;
  } catch {
    return null;
  }
};

/** Получить локальный URI обложки, если она загружена */
export const getLocalCoverUri = async (bookId: string): Promise<string | null> => {
  const path = getCoverFilePath(bookId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
};

/** Скачать главу с прогрессом */
export const downloadChapter = async (
  chapter: Chapter,
  book: Book,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; localUri?: string; error?: string }> => {
  try {
    await ensureBookDirExists(book.id);

    const uri = getChapterFilePath(book.id, chapter.id);
    const downloadResumable = FileSystem.createDownloadResumable(
      chapter.audio_url,
      uri,
      {},
      (downloadProgress) => {
        const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
        const pct = totalBytesExpectedToWrite > 0
          ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
          : 0;
        onProgress?.(pct);
      },
    );

    const result = await downloadResumable.downloadAsync();

    if (result?.uri) {
      // Сохраняем метаданные
      await saveChapterMetadata({
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        chapterId: chapter.id,
        chapterNumber: chapter.chapter_number,
        chapterTitle: chapter.title,
      });

      return { success: true, localUri: result.uri };
    }

    return {
      success: false,
      error: 'Ошибка при скачивании файла',
    };
  } catch (error: any) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error?.message || 'Неизвестная ошибка',
    };
  }
};

// Serializes all reads + writes to books_meta.json so concurrent downloads
// never overwrite each other's chapter entries.
let metaWriteQueue: Promise<void> = Promise.resolve();

const doSaveChapterMetadata = async (meta: ChapterDownloadMeta): Promise<void> => {
  try {
    const metaFile = BOOKS_META_FILE;
    let allMeta: BookDownloadMeta[] = [];

    const exists = await FileSystem.getInfoAsync(metaFile);
    if (exists.exists) {
      try {
        const content = await FileSystem.readAsStringAsync(metaFile);
        allMeta = JSON.parse(content);
      } catch (e) {
        allMeta = [];
      }
    }

    // Найти книгу или создать новую
    let bookMeta = allMeta.find((m) => m.bookId === meta.bookId);
    if (!bookMeta) {
      bookMeta = {
        bookId: meta.bookId,
        bookTitle: meta.bookTitle,
        bookAuthor: meta.bookAuthor,
        chapters: [],
        downloadedAt: new Date().toISOString(),
      };
      allMeta.push(bookMeta);
    }

    // Добавить главу или обновить
    const chapterIdx = bookMeta.chapters.findIndex(
      (c) => c.chapterId === meta.chapterId,
    );
    if (chapterIdx >= 0) {
      bookMeta.chapters[chapterIdx] = meta;
    } else {
      bookMeta.chapters.push(meta);
    }

    bookMeta.downloadedAt = new Date().toISOString();

    await FileSystem.writeAsStringAsync(metaFile, JSON.stringify(allMeta));
  } catch (error) {
    console.error('Error saving chapter metadata:', error);
  }
};

/** Сохранить метаданные главы (сериализовано, без race condition) */
const saveChapterMetadata = (meta: ChapterDownloadMeta): Promise<void> => {
  const result = metaWriteQueue.then(() => doSaveChapterMetadata(meta));
  metaWriteQueue = result.catch(() => {});
  return result;
};

/** Удалить запись книги из books_meta.json (сериализовано) */
const removeBookFromMetadata = (bookId: string): Promise<void> => {
  const result = metaWriteQueue.then(async () => {
    try {
      const metaFile = BOOKS_META_FILE;
      const exists = await FileSystem.getInfoAsync(metaFile);
      if (!exists.exists) return;
      const content = await FileSystem.readAsStringAsync(metaFile);
      const allMeta: BookDownloadMeta[] = JSON.parse(content);
      const filtered = allMeta.filter((m) => m.bookId !== bookId);
      await FileSystem.writeAsStringAsync(metaFile, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing book from metadata:', error);
    }
  });
  metaWriteQueue = result.catch(() => {});
  return result;
};

/** Получить размер загруженных файлов (в байтах) */
export const getDownloadsSize = async (): Promise<number> => {
  const bookDir = getBookDir();
  const info = await FileSystem.getInfoAsync(bookDir);
  if (!info.exists) return 0;

  let totalSize = 0;

  try {
    const items = await FileSystem.readDirectoryAsync(bookDir);

    for (const item of items) {
      if (item === 'books_meta.json') {
        const fileUri = `${bookDir}${item}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
        }
      } else {
        const bookSubDir = `${bookDir}${item}/`;
        const subDirInfo = await FileSystem.getInfoAsync(bookSubDir);
        if (subDirInfo.exists && subDirInfo.isDirectory) {
          const files = await FileSystem.readDirectoryAsync(bookSubDir);
          for (const file of files) {
            if (file.endsWith('.m4a')) {
              const fileUri = `${bookSubDir}${file}`;
              const fileInfo = await FileSystem.getInfoAsync(fileUri);
              if (fileInfo.exists) {
                totalSize += fileInfo.size || 0;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error calculating downloads size:', error);
  }

  return totalSize;
};

/** Форматировать размер в читаемый вид */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
};
