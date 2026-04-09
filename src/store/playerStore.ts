import { create } from 'zustand';
import { Book, Chapter } from '../types';

interface PlayerStore {
  currentBook: Book | null;
  currentChapter: Chapter | null;
  chapterIndex: number;
  isPlaying: boolean;
  speed: number;
  position: number;   // секунды
  duration: number;   // секунды
  set: (partial: Partial<PlayerStore>) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentBook: null,
  currentChapter: null,
  chapterIndex: 0,
  isPlaying: false,
  speed: 1.0,
  position: 0,
  duration: 0,
  set: (partial) => set(partial),
}));
