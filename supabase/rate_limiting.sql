-- =====================================================
-- HARFBAZ: RATE LIMITING VE DDoS KORUMA
-- =====================================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın
-- Veritabanı seviyesinde rate limiting sağlar
-- =====================================================

-- 1. RATE LIMIT TABLOSU
-- IP/User bazlı istek sayısını takip eder
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,           -- IP adresi veya user ID
  action_type text NOT NULL,           -- Örn: 'create_room', 'join_room', 'submit_answer'
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT NOW(),
  UNIQUE(identifier, action_type)
);

-- Index: Hızlı sorgulama için
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits(identifier, action_type, window_start);

-- 2. RATE LIMIT KONTROL FONKSİYONU
-- Belirli bir süre içinde izin verilen istek sayısını kontrol eder
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,           -- IP veya User ID
  p_action_type text,          -- İşlem türü
  p_max_requests integer,      -- Pencere içinde max istek sayısı
  p_window_seconds integer     -- Zaman penceresi (saniye)
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz;
BEGIN
  -- Mevcut kaydı kontrol et
  SELECT request_count, window_start 
  INTO v_current_count, v_window_start
  FROM public.rate_limits
  WHERE identifier = p_identifier AND action_type = p_action_type;
  
  -- Kayıt yoksa yeni oluştur
  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (identifier, action_type, request_count, window_start)
    VALUES (p_identifier, p_action_type, 1, NOW());
    RETURN true; -- İzin ver
  END IF;
  
  -- Pencere süresi dolmuşsa sıfırla
  IF v_window_start < NOW() - (p_window_seconds || ' seconds')::interval THEN
    UPDATE public.rate_limits
    SET request_count = 1, window_start = NOW()
    WHERE identifier = p_identifier AND action_type = p_action_type;
    RETURN true; -- İzin ver
  END IF;
  
  -- Limit aşıldı mı?
  IF v_current_count >= p_max_requests THEN
    RETURN false; -- ENGELLE
  END IF;
  
  -- Sayacı artır
  UPDATE public.rate_limits
  SET request_count = request_count + 1
  WHERE identifier = p_identifier AND action_type = p_action_type;
  
  RETURN true; -- İzin ver
END;
$$;

-- 3. RATE LIMIT TABLOSUNU TEMİZLEME (Günlük)
-- Eski kayıtları temizleyen cron job
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 4 * * *',  -- Her gün saat 04:00'te
  $$DELETE FROM public.rate_limits WHERE window_start < NOW() - INTERVAL '1 day'$$
);

-- 4. RLS POLİTİKASI
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Sadece sistem fonksiyonları erişebilir
CREATE POLICY "Rate limits system only" ON public.rate_limits
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- 5. FONKSİYON İZİNLERİ
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO anon, authenticated;

-- =====================================================
-- KULLANIM ÖRNEĞİ (Mevcut RPC'lere eklenebilir):
-- 
-- IF NOT check_rate_limit(current_user_id, 'create_room', 5, 60) THEN
--   RAISE EXCEPTION 'Çok fazla istek! Lütfen bekleyin.';
-- END IF;
--
-- Bu örnek: Dakikada max 5 oda oluşturma izni verir
-- =====================================================

-- =====================================================
-- ÖNERİLEN LİMİTLER:
-- • create_room: 5 istek / 60 saniye
-- • join_room: 10 istek / 60 saniye  
-- • submit_answer: 30 istek / 60 saniye
-- • toggle_vote: 60 istek / 60 saniye
-- =====================================================
