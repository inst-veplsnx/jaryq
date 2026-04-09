import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://gadnsdnbflexvggcghji.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZG5zZG5iZmxleHZnZ2NnaGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Njk1NTQsImV4cCI6MjA5MTI0NTU1NH0.lZYYOy3PxdJ7Yqlc3KLHiOaWrh3aMyQHp3hpabesQEA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
