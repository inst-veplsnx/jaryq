import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SUPABASE_URL = (Constants.expoConfig?.extra as any)?.SUPABASE_URL
  || (Constants.expoConfig?.extra as any)?.supabaseUrl
  || 'https://ВАШ_ПРОЕКТ.supabase.co';

const SUPABASE_ANON_KEY = (Constants.expoConfig?.extra as any)?.SUPABASE_ANON_KEY
  || (Constants.expoConfig?.extra as any)?.supabaseAnonKey
  || 'ВАШ_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
