export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  description?: string;
  cover_url?: string;
  genre_id?: string;
  genre?: Genre;
  total_duration?: number;
  total_chapters?: number;
  is_new?: boolean;
  is_popular?: boolean;
  language?: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  audio_url: string;
  duration: number;
}

export interface Genre {
  id: string;
  name: string;
  icon?: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string;
  chapter_number: number;
  position: number;
  updated_at: string;
  book?: Book;
}

export interface Favorite {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  book?: Book;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  BookshelfTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  NewArrivals: undefined;
  Genres: undefined;
  GenreBooks: { genre: Genre };
  Popular: undefined;
  AllBooks: undefined;
  BookDetail: { book: Book };
  Player: { book: Book; chapterIndex?: number };
  Favorites: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  BookDetail: { book: Book };
  Player: { book: Book; chapterIndex?: number };
};

export type BookshelfStackParamList = {
  Bookshelf: undefined;
  BookDetail: { book: Book };
  Player: { book: Book; chapterIndex?: number };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};
