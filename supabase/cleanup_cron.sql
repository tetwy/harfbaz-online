-- =====================================================
-- HARFBAZ: OTOMATİK VERİTABANI TEMİZLİĞİ (Cron Job)
-- =====================================================
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın
-- =====================================================

-- 1. pg_cron EXTENSION'INI ETKİNLEŞTİR
-- Not: Supabase'de bu extension varsayılan olarak etkin olabilir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. TEMİZLİK FONKSİYONU
-- Bu fonksiyon 1 saatten eski ve LOBBY veya GAME_OVER durumundaki odaları siler
-- İlişkili oyuncular, cevaplar ve oylar CASCADE ile otomatik silinir

CREATE OR REPLACE FUNCTION public.cleanup_stale_rooms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 1 saatten fazla güncellenmemiş ve aktif olmayan odaları sil
  -- Aktif oda = PLAYING veya VOTING durumunda olan
  WITH deleted AS (
    DELETE FROM public.rooms
    WHERE 
      -- Son güncelleme 1 saatten eski
      updated_at < NOW() - INTERVAL '1 hour'
      -- VE aktif oyun durumunda değil
      AND status NOT IN ('PLAYING', 'VOTING')
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log (isteğe bağlı - debug için)
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Temizlik tamamlandı: % eski oda silindi', deleted_count;
  END IF;
END;
$$;

-- 3. CRON JOB TANIMLA (Her 1 saatte bir çalışır)
-- Not: pg_cron Supabase'de 'cron' şemasında çalışır

-- Önce varsa eski job'ı sil (tekrar çalıştırılabilir olması için)
SELECT cron.unschedule('cleanup-stale-rooms') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-rooms');

-- Yeni job oluştur: Her saat başı çalışır (0 * * * *)
SELECT cron.schedule(
  'cleanup-stale-rooms',      -- Job adı
  '0 * * * *',                 -- Cron ifadesi: Her saat başı
  $$SELECT public.cleanup_stale_rooms()$$  -- Çalıştırılacak SQL
);

-- 4. DOĞRULAMA: Job'ın oluşturulduğunu kontrol et
SELECT * FROM cron.job WHERE jobname = 'cleanup-stale-rooms';

-- =====================================================
-- NOTLAR:
-- • Cron ifadesi: '0 * * * *' = Her saat başı (13:00, 14:00, ...)
-- • Daha sık istiyorsanız: '*/30 * * * *' = Her 30 dakikada bir
-- • Daha seyrek istiyorsanız: '0 */2 * * *' = Her 2 saatte bir
--
-- • CASCADE kullanıldığı için odayla ilişkili tüm veriler silinir:
--   - players (room_id referansı ile)
--   - answers (room_id referansı ile)
--   - votes (room_id referansı ile)
--
-- • Manuel test için: SELECT public.cleanup_stale_rooms();
-- =====================================================
