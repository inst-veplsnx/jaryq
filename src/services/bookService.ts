import { supabase } from './supabase';
import { Book, Chapter, Favorite, Genre, UserProgress } from '../types';

export const bookService = {

  async getNewArrivals(limit = 100): Promise<Book[]> {
    const { data } = await supabase
      .from('books').select('*, genre:genres(*)')
      .eq('is_new', true).order('created_at', { ascending: false }).limit(limit);
    return data || [];
  },

  async getPopular(limit = 50): Promise<Book[]> {
    const { data } = await supabase
      .from('books').select('*, genre:genres(*)')
      .eq('is_popular', true).order('created_at', { ascending: false }).limit(limit);
    return data || [];
  },

  async getAllBooks(): Promise<Book[]> {
    const { data } = await supabase
      .from('books').select('*, genre:genres(*)')
      .order('author', { ascending: true });
    return data || [];
  },

  async getBooksByGenre(genreId: string): Promise<Book[]> {
    const { data } = await supabase
      .from('books').select('*, genre:genres(*)')
      .eq('genre_id', genreId).order('title', { ascending: true });
    return data || [];
  },

  async searchBooks(query: string): Promise<Book[]> {
    const { data } = await supabase
      .from('books').select('*, genre:genres(*)')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,narrator.ilike.%${query}%`)
      .limit(50);
    return data || [];
  },

  async getChapters(bookId: string): Promise<Chapter[]> {
    const { data } = await supabase
      .from('chapters').select('*').eq('book_id', bookId)
      .order('chapter_number', { ascending: true });
    return data || [];
  },

  async getGenres(): Promise<Genre[]> {
    const { data } = await supabase.from('genres').select('*').order('name');
    return data || [];
  },

  async saveProgress(
    userId: string, bookId: string, chapterId: string,
    chapterNumber: number, position: number,
  ): Promise<void> {
    await supabase.from('user_progress').upsert({
      user_id: userId, book_id: bookId, chapter_id: chapterId,
      chapter_number: chapterNumber, position,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,book_id' });
  },

  async getProgress(userId: string, bookId: string): Promise<UserProgress | null> {
    const { data } = await supabase.from('user_progress').select('*')
      .eq('user_id', userId).eq('book_id', bookId).single();
    return data;
  },

  async getAllProgress(userId: string): Promise<UserProgress[]> {
    const { data } = await supabase.from('user_progress')
      .select('*, book:books(*, genre:genres(*))')
      .eq('user_id', userId).order('updated_at', { ascending: false });
    return data || [];
  },

  async getFavorites(userId: string): Promise<Favorite[]> {
    const { data } = await supabase.from('favorites')
      .select('*, book:books(*, genre:genres(*))')
      .eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  async addFavorite(userId: string, bookId: string): Promise<void> {
    await supabase.from('favorites').insert({ user_id: userId, book_id: bookId });
  },

  async removeFavorite(userId: string, bookId: string): Promise<void> {
    await supabase.from('favorites').delete()
      .eq('user_id', userId).eq('book_id', bookId);
  },

  async isFavorite(userId: string, bookId: string): Promise<boolean> {
    const { data } = await supabase.from('favorites').select('id')
      .eq('user_id', userId).eq('book_id', bookId).single();
    return !!data;
  },
};
