-- =====================================================
-- HARFBAZ: GİZLİ MOD REVEAL FİXİ (Atomic Operation)
-- =====================================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın
-- Race condition sorununu çözer
-- =====================================================

-- Eski fonksiyon varsa sil
DROP FUNCTION IF EXISTS reveal_player_card(uuid, uuid);
DROP FUNCTION IF EXISTS reveal_player_card(uuid, text);

-- Atomic reveal fonksiyonu
-- array_append ile eş zamanlı güncelleme sorununu önler
CREATE OR REPLACE FUNCTION public.reveal_player_card(
  p_room_id uuid,
  p_player_id text  -- text olarak değiştirildi (revealed_players text[] olduğu için)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atomik güncelleme: Sadece listede yoksa ekle
  UPDATE public.rooms
  SET revealed_players = array_append(
    COALESCE(revealed_players, ARRAY[]::text[]),
    p_player_id
  )
  WHERE id = p_room_id
    AND NOT (COALESCE(revealed_players, ARRAY[]::text[]) @> ARRAY[p_player_id]);
END;
$$;

-- Fonksiyona erişim izni
GRANT EXECUTE ON FUNCTION public.reveal_player_card(uuid, text) TO anon, authenticated;
