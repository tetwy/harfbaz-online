// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

// .env.local dosyasındaki değişkenleri kullanıyoruz
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL veya Key eksik! .env.local dosyasını kontrol et.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);