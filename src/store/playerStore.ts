import { create } from 'zustand';
import { Book, Chapter } from '../types';

// Separating state from actions ensures set() cannot accidentally receive the
// action itself (e.g. set({ set: fn })), which would silently corrupt the store.
interface PlayerState {
  currentBook: Book | null;
  currentChapter: Chapter | null;
  chapterIndex: number;
  isPlaying: boolean;
  speed: number;
  position: number;   // секунды
  duration: number;   // секунды
}

interface PlayerStore extends PlayerState {
  set: (partial: Partial<PlayerState>) => void;
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
