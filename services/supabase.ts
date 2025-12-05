import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL veya Key eksik! .env.local dosyasını kontrol et.");
}

// Güvenli Storage Adaptörü: Tarayıcı izin vermezse hata fırlatmak yerine belleği kullanır.
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage erişimi engellendi, bellek kullanılıyor.');
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Erişim yoksa yoksay
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Erişim yoksa yoksay
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});