import { supabase } from './supabase';
import { Book, Chapter, Favorite, Genre, UserProgress } from '../types';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateBookCache(key?: string): void {
  if (key) cache.delete(key);
  else cache.clear();
}

export const bookService = {

  async getNewArrivals(limit = 100): Promise<Book[]> {
    const key = `newArrivals:${limit}`;
    const hit = getCached<Book[]>(key);
    if (hit) return hit;
    try {
      const { data, error } = await supabase
        .from('books').select('*, genre:genres(*)')
        .eq('is_new', true).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      const result = data || [];
      setCached(key, result);
      return result;
    } catch (error: any) {
      console.error('Error fetching new arrivals:', error.message);
      return [];
    }
  },

  async getPopular(limit = 50): Promise<Book[]> {
    const key = `popular:${limit}`;
    const hit = getCached<Book[]>(key);
    if (hit) return hit;
    try {
      const { data, error } = await supabase
        .from('books').select('*, genre:genres(*)')
        .eq('is_popular', true).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      const result = data || [];
      setCached(key, result);
      return result;
    } catch (error: any) {
      console.error('Error fetching popular books:', error.message);
      return [];
    }
  },

  async getAllBooks(offset = 0, pageSize = 50): Promise<Book[]> {
    const key = `allBooks:${offset}:${pageSize}`;
    const hit = getCached<Book[]>(key);
    if (hit) return hit;
    try {
      const { data, error } = await supabase
        .from('books').select('*, genre:genres(*)')
        .order('author', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      const result = data || [];
      setCached(key, result);
      return result;
    } catch (error: any) {
      console.error('Error fetching all books:', error.message);
      return [];
    }
  },

  async getBooksByGenre(genreId: string): Promise<Book[]> {
    const key = `genre:${genreId}`;
    const hit = getCached<Book[]>(key);
    if (hit) return hit;
    try {
      const { data, error } = await supabase
        .from('books').select('*, genre:genres(*)')
        .eq('genre_id', genreId).order('title', { ascending: true });
      if (error) throw error;
      const result = data || [];
      setCached(key, result);
      return result;
    } catch (error: any) {
      console.error('Error fetching books by genre:', error.message);
      return [];
    }
  },

  async searchBooks(query: string): Promise<Book[]> {
    const safe = query.replace(/%/g, '\\%').replace(/_/g, '\\_');
    try {
      const { data, error } = await supabase
        .from('books').select('*, genre:genres(*)')
        .or(`title.ilike.%${safe}%,author.ilike.%${safe}%,narrator.ilike.%${safe}%`)
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error searching books:', error.message);
      return [];
    }
  },

  async getChapters(bookId: string): Promise<Chapter[]> {
    const key = `chapters:${bookId}`;
    const hit = getCached<Chapter[]>(key);
    if (hit) return hit;
    try {
      const { data, error } = await supabase
        .from('chapters').select('*').eq('book_id', bookId)
        .order('chapter_number', { ascending: true });
      if (error) throw error;
      const result = data || [];
      setCached(key, result);
      return result;
    } catch (error: any) {
      console.error('Error fetching chapters:', error.message);
      return [];
    }
  },

  async getGenres(): Promise<Genre[]> {
    const key = 'genres';
    const hit = getCached<Genre[]>(key);
    if (hit) return hit;
    try {
      const { data, error } = await supabase.from('genres').select('*').order('name');
      if (error) throw error;
      const result = data || [];
      setCached(key, result);
      return result;
    } catch (error: any) {
      console.error('Error fetching genres:', error.message);
      return [];
    }
  },

  async saveProgress(
    userId: string, bookId: string, chapterId: string,
    chapterNumber: number, position: number,
  ): Promise<void> {
    try {
      await supabase.from('user_progress').upsert({
        user_id: userId, book_id: bookId, chapter_id: chapterId,
        chapter_number: chapterNumber, position,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,book_id' });
    } catch (error: any) {
      console.error('Error saving progress:', error.message);
    }
  },

  async getProgress(userId: string, bookId: string): Promise<UserProgress | null> {
    try {
      const { data, error } = await supabase.from('user_progress').select('*')
        .eq('user_id', userId).eq('book_id', bookId).maybeSingle();
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching progress:', error.message);
      return null;
    }
  },

  async getAllProgress(userId: string): Promise<UserProgress[]> {
    try {
      const { data, error } = await supabase.from('user_progress')
        .select('*, book:books(*, genre:genres(*))')
        .eq('user_id', userId).order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all progress:', error.message);
      return [];
    }
  },

  async getFavorites(userId: string): Promise<Favorite[]> {
    try {
      const { data, error } = await supabase.from('favorites')
        .select('*, book:books(*, genre:genres(*))')
        .eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching favorites:', error.message);
      return [];
    }
  },

  async addFavorite(userId: string, bookId: string): Promise<void> {
    try {
      await supabase.from('favorites').insert({ user_id: userId, book_id: bookId });
    } catch (error: any) {
      console.error('Error adding favorite:', error.message);
      throw error;
    }
  },

  async removeFavorite(userId: string, bookId: string): Promise<void> {
    try {
      await supabase.from('favorites').delete()
        .eq('user_id', userId).eq('book_id', bookId);
    } catch (error: any) {
      console.error('Error removing favorite:', error.message);
      throw error;
    }
  },

  async isFavorite(userId: string, bookId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('favorites').select('id')
        .eq('user_id', userId).eq('book_id', bookId).maybeSingle();
      if (error) {
        console.error('Error checking favorite:', error.message);
        return false;
      }
      return !!data;
    } catch {
      return false;
    }
  },

  async clearAllProgress(userId: string): Promise<void> {
    try {
      await supabase.from('user_progress').delete().eq('user_id', userId);
    } catch (error: any) {
      console.error('Error clearing progress:', error.message);
      throw error;
    }
  },
};
