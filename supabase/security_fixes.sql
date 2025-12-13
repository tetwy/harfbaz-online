-- =====================================================
-- HARFBAZ: SECURITY ADVISOR FIXES
-- =====================================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın
-- =====================================================

-- 1. calculate_round_scores fonksiyonunu güvenli search_path ile güncel
CREATE OR REPLACE FUNCTION calculate_round_scores(p_room_id uuid, p_round_number integer)
RETURNS void AS $$
DECLARE
  v_current_letter text;
  v_player record;
  v_total_players int;
  v_categories text[] := ARRAY['İsim', 'Şehir', 'Hayvan', 'Bitki', 'Eşya', 'Ünlü', 'Ülke', 'Meslek', 'Yemek', 'Dizi/Film'];
  v_category text;
  v_answer_json jsonb;
  v_answer_text text;
  v_vote_count int;
  v_duplicate_count int;
  v_round_score int;
  v_last_scored int;
BEGIN
  -- İdempotency kontrolü
  SELECT last_scored_round INTO v_last_scored FROM public.rooms WHERE id = p_room_id;
  IF v_last_scored >= p_round_number THEN
    RETURN;
  END IF;

  SELECT current_letter INTO v_current_letter FROM public.rooms WHERE id = p_room_id;
  SELECT count(*) INTO v_total_players FROM public.players WHERE room_id = p_room_id;

  IF v_current_letter IS NULL THEN RETURN; END IF;

  FOR v_player IN SELECT * FROM public.players WHERE room_id = p_room_id LOOP
    v_round_score := 0;
    SELECT answers_json INTO v_answer_json FROM public.answers 
    WHERE room_id = p_room_id AND round_number = p_round_number AND player_id = v_player.id;

    IF v_answer_json IS NOT NULL THEN
      FOREACH v_category IN ARRAY v_categories LOOP
        v_answer_text := trim(lower(v_answer_json->>v_category));
        
        IF v_answer_text != '' AND left(v_answer_text, 1) = lower(v_current_letter) THEN
          SELECT count(*) INTO v_vote_count FROM public.votes 
          WHERE room_id = p_room_id AND round_number = p_round_number 
            AND target_player_id = v_player.id AND category = v_category AND is_veto = true;
            
          IF v_vote_count <= (v_total_players / 2) THEN
             SELECT count(*) INTO v_duplicate_count FROM public.answers a
             WHERE a.room_id = p_room_id AND a.round_number = p_round_number
               AND trim(lower(a.answers_json->>v_category)) = v_answer_text;
               
             IF v_duplicate_count > 1 THEN v_round_score := v_round_score + 5;
             ELSE v_round_score := v_round_score + 10; END IF;
          END IF;
        END IF;
      END LOOP;
      UPDATE public.players SET score = score + v_round_score WHERE id = v_player.id;
    END IF;
  END LOOP;

  UPDATE public.rooms SET last_scored_round = p_round_number WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. get_answer_count fonksiyonunu sil (kullanılmıyor)
DROP FUNCTION IF EXISTS public.get_answer_count;

-- 3. toggle_vote_secure fonksiyonunu güvenli search_path ile güncelle
CREATE OR REPLACE FUNCTION toggle_vote_secure(
  p_room_id uuid,
  p_round_number integer,
  p_voter_id uuid,
  p_target_player_id uuid,
  p_category text
)
RETURNS void AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  SELECT id INTO v_existing_id FROM public.votes 
  WHERE room_id = p_room_id 
    AND round_number = p_round_number 
    AND voter_id = p_voter_id 
    AND target_player_id = p_target_player_id 
    AND category = p_category;

  IF v_existing_id IS NOT NULL THEN
    DELETE FROM public.votes WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.votes (room_id, round_number, voter_id, target_player_id, category, is_veto)
    VALUES (p_room_id, p_round_number, p_voter_id, p_target_player_id, p_category, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. generate_room_code fonksiyonunu güvenli search_path ile güncelle
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- NOT: Aşağıdaki uyarılar IGNORE edilebilir:
-- =====================================================
-- * cron.job / cron.job_run_details anonymous access: 
--   Supabase internal, kontrol edemeyiz
--
-- * public.* tabloları anonymous access:
--   Oyun anonim auth kullandığı için GEREKLİ
--
-- * Leaked password protection:
--   Şifre kullanmıyoruz, anonim auth
-- =====================================================
