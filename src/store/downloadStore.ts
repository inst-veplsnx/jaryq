import { create } from 'zustand';
import { Chapter, Book } from '../types';
import { DOWNLOAD_COMPLETE_CLEAR_DELAY_MS } from '../utils/constants';
import {
  DownloadInfo,
  downloadChapter,
  isChapterDownloaded,
  getDownloadedChapters,
  deleteChapter,
  deleteBookDownloads,
  deleteAllDownloads,
  getDownloadsSize,
  getAllDownloadedBooks,
  BookDownloadMeta,
  downloadBookCover,
  getLocalCoverUri,
} from '../services/downloadService';

interface DownloadState {
  /** Карта загрузок: ключ = bookId-chapterId */
  downloads: Record<string, DownloadInfo>;

  /** Загруженные главы: bookId -> [chapterId, ...] */
  downloadedChapters: Record<string, string[]>;

  /** Все загруженные книги */
  downloadedBooks: BookDownloadMeta[];

  /** Общий размер загрузок */
  downloadsSize: number;

  /** Инициализация — проверить существующие загрузки */
  initialize: () => Promise<void>;

  /** Скачать главу */
  downloadChapter: (chapter: Chapter, book: Book) => Promise<void>;

  /** Удалить главу */
  deleteChapter: (bookId: string, chapterId: string) => Promise<void>;

  /** Скачать все главы книги */
  downloadAllChapters: (chapters: Chapter[], book: Book) => Promise<void>;

  /** Удалить все главы книги */
  deleteBookDownloads: (bookId: string) => Promise<void>;

  /** Удалить все загрузки */
  deleteAllDownloads: () => Promise<void>;

  /** Проверить, загружена ли глава */
  isChapterDownloaded: (bookId: string, chapterId: string) => boolean;

  /** Получить процент загруженных глав */
  getDownloadedPercent: (bookId: string, totalChapters: number) => number;

  /** Обновить размер загрузок */
  refreshDownloadsSize: () => Promise<void>;

  /** Локальные URI обложек: bookId -> localUri */
  localCoverUris: Record<string, string>;
}

const getChapterKey = (bookId: string, chapterId: string): string =>
  `${bookId}-${chapterId}`;

// Module-level flag to cancel the currently running downloadAllChapters loop
let _batchDownloadCancelled = false;

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: {},
  downloadedChapters: {},
  downloadedBooks: [],
  downloadsSize: 0,
  localCoverUris: {},

  initialize: async () => {
    const books = await getAllDownloadedBooks();

    const chaptersMap: Record<string, string[]> = {};
    const coverUris: Record<string, string> = {};

    for (const book of books) {
      const chapterIds = await getDownloadedChapters(book.bookId);
      chaptersMap[book.bookId] = chapterIds;
      const coverUri = await getLocalCoverUri(book.bookId);
      if (coverUri) coverUris[book.bookId] = coverUri;
    }

    const size = await getDownloadsSize();

    set({
      downloadedBooks: books,
      downloadedChapters: chaptersMap,
      downloadsSize: size,
      localCoverUris: coverUris,
    });
  },

  downloadChapter: async (chapter: Chapter, book: Book) => {
    const key = getChapterKey(book.id, chapter.id);

    // Prevent duplicate concurrent downloads for the same chapter
    if (get().downloads[key]?.status === 'downloading') return;

    set((state) => ({
      downloads: {
        ...state.downloads,
        [key]: { status: 'downloading', progress: 0 },
      },
    }));

    const result = await downloadChapter(
      chapter,
      book,
      (progress) => {
        set((state) => ({
          downloads: {
            ...state.downloads,
            [key]: { status: 'downloading', progress },
          },
        }));
      },
    );

    if (result.success) {
      const chapterIds = await getDownloadedChapters(book.id);
      const books = await getAllDownloadedBooks();
      const size = await getDownloadsSize();

      // Скачать обложку если ещё нет
      const existingCover = get().localCoverUris[book.id];
      let newCoverUri: string | undefined = existingCover;
      if (!existingCover) {
        newCoverUri = (await downloadBookCover(book)) ?? undefined;
      }

      set((state) => ({
        downloads: {
          ...state.downloads,
          [key]: {
            status: 'completed',
            progress: 100,
            localUri: result.localUri,
          },
        },
        downloadedChapters: {
          ...state.downloadedChapters,
          [book.id]: chapterIds,
        },
        downloadedBooks: books,
        downloadsSize: size,
        localCoverUris: newCoverUri
          ? { ...state.localCoverUris, [book.id]: newCoverUri }
          : state.localCoverUris,
      }));

      // Убрать статус через 1 секунду
      setTimeout(() => {
        set((state) => {
          const newDownloads = { ...state.downloads };
          delete newDownloads[key];
          return { downloads: newDownloads };
        });
      }, DOWNLOAD_COMPLETE_CLEAR_DELAY_MS);
    } else {
      set((state) => ({
        downloads: {
          ...state.downloads,
          [key]: {
            status: 'error',
            progress: 0,
            error: result.error || 'Ошибка загрузки',
          },
        },
      }));
    }
  },

  deleteChapter: async (bookId: string, chapterId: string) => {
    await deleteChapter(bookId, chapterId);

    const chapterIds = await getDownloadedChapters(bookId);
    const books = await getAllDownloadedBooks();
    const size = await getDownloadsSize();

    set({
      downloadedChapters: {
        ...get().downloadedChapters,
        [bookId]: chapterIds,
      },
      downloadedBooks: books,
      downloadsSize: size,
    });
  },

  downloadAllChapters: async (chapters: Chapter[], book: Book) => {
    _batchDownloadCancelled = false;

    // Скачать все главы последовательно
    for (let i = 0; i < chapters.length; i++) {
      if (_batchDownloadCancelled) break;

      const chapter = chapters[i];
      const key = getChapterKey(book.id, chapter.id);

      // Пропустить уже загруженные
      const alreadyDownloaded = await isChapterDownloaded(book.id, chapter.id);
      if (alreadyDownloaded) {
        continue;
      }

      set((state) => ({
        downloads: {
          ...state.downloads,
          [key]: { status: 'downloading', progress: 0 },
        },
      }));

      const result = await downloadChapter(
        chapter,
        book,
        (progress) => {
          set((state) => ({
            downloads: {
              ...state.downloads,
              [key]: { status: 'downloading', progress },
            },
          }));
        },
      );

      if (result.success) {
        // Only update download status here; downloadedChapters is reconciled once after the loop
        set((state) => ({
          downloads: {
            ...state.downloads,
            [key]: { status: 'completed', progress: 100, localUri: result.localUri },
          },
        }));
      } else {
        set((state) => ({
          downloads: {
            ...state.downloads,
            [key]: {
              status: 'error',
              progress: 0,
              error: result.error || 'Ошибка загрузки',
            },
          },
        }));
      }
    }

    // Обновить списки
    const chapterIds = await getDownloadedChapters(book.id);
    const books = await getAllDownloadedBooks();
    const size = await getDownloadsSize();

    set({
      downloadedChapters: {
        ...get().downloadedChapters,
        [book.id]: chapterIds,
      },
      downloadedBooks: books,
      downloadsSize: size,
    });
  },

  deleteBookDownloads: async (bookId: string) => {
    await deleteBookDownloads(bookId);

    const books = await getAllDownloadedBooks();
    const size = await getDownloadsSize();

    set({
      downloadedChapters: {
        ...get().downloadedChapters,
        [bookId]: [],
      },
      downloadedBooks: books,
      downloadsSize: size,
    });
  },

  deleteAllDownloads: async () => {
    _batchDownloadCancelled = true;
    await deleteAllDownloads();

    set({
      downloads: {},
      downloadedChapters: {},
      downloadedBooks: [],
      downloadsSize: 0,
      localCoverUris: {},
    });
  },

  isChapterDownloaded: (bookId: string, chapterId: string) => {
    const state = get();
    const chapters = state.downloadedChapters[bookId] || [];
    return chapters.includes(chapterId);
  },

  getDownloadedPercent: (bookId: string, totalChapters: number) => {
    if (totalChapters === 0) return 0;
    const state = get();
    const chapters = state.downloadedChapters[bookId] || [];
    return Math.round((chapters.length / totalChapters) * 100);
  },

  refreshDownloadsSize: async () => {
    const size = await getDownloadsSize();
    const books = await getAllDownloadedBooks();

    set({
      downloadsSize: size,
      downloadedBooks: books,
    });
  },
}));
