import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { User } from '../types';

// Module-level: prevents duplicate subscriptions if initialize() is called more than once
let _authSubscription: { unsubscribe: () => void } | null = null;

/** Вынести получение профиля в отдельную функцию */
async function fetchProfile(userId: string): Promise<User | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('Failed to fetch profile:', error.message);
      return null;
    }
    return profile;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    // Always tear down the previous listener before creating a new one
    _authSubscription?.unsubscribe();
    _authSubscription = null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ session, user: profile, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ session, user: profile, loading: false, error: null });
      } else {
        set({ session: null, user: null, loading: false });
      }
    });

    _authSubscription = subscription;
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message, loading: false });
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      const msg = err?.message || 'Неизвестная ошибка';
      set({ error: msg, loading: false });
      return { error: msg };
    }
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        set({ error: error.message, loading: false });
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      const msg = err?.message || 'Неизвестная ошибка';
      set({ error: msg, loading: false });
      return { error: msg };
    }
  },

  signOut: async () => {
    _authSubscription?.unsubscribe();
    _authSubscription = null;
    try {
      await supabase.auth.signOut();
    } catch {
      // Игнорируем ошибки при выходе
    }
    set({ user: null, session: null, error: null, loading: false });
  },
}));
