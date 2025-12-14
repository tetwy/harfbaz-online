-- =====================================================
-- HARFBAZ: GAME ID MIGRATION
-- =====================================================
-- Bu migration game_id eklenerek oyun oturumları izole edilir
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- =====================================================

-- 1. rooms tablosuna current_game_id ekle
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_game_id uuid DEFAULT gen_random_uuid();

-- 2. answers tablosuna game_id ekle
ALTER TABLE answers ADD COLUMN IF NOT EXISTS game_id uuid;

-- 3. votes tablosuna game_id ekle
ALTER TABLE votes ADD COLUMN IF NOT EXISTS game_id uuid;

-- 4. Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_answers_game_id ON answers(game_id);
CREATE INDEX IF NOT EXISTS idx_votes_game_id ON votes(game_id);

-- 5. Mevcut verileri temizle (güvenli başlangıç için)
DELETE FROM answers;
DELETE FROM votes;
UPDATE players SET score = 0;

-- 6. calculate_round_scores fonksiyonunu güncelle (game_id filtresi ile)
CREATE OR REPLACE FUNCTION calculate_round_scores(p_room_id uuid, p_round_number integer)
RETURNS void AS $$
DECLARE
  v_current_letter text;
  v_game_id uuid;
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
  SELECT last_scored_round, current_letter, current_game_id 
  INTO v_last_scored, v_current_letter, v_game_id 
  FROM rooms WHERE id = p_room_id;
  
  IF v_last_scored >= p_round_number THEN
    RETURN; -- Bu tur zaten hesaplandı
  END IF;

  IF v_current_letter IS NULL OR v_game_id IS NULL THEN RETURN; END IF;

  SELECT count(*) INTO v_total_players FROM players WHERE room_id = p_room_id;

  FOR v_player IN SELECT * FROM players WHERE room_id = p_room_id LOOP
    v_round_score := 0;
    
    -- KRITIK: game_id filtresi ile sadece mevcut oyunun cevaplarını al
    SELECT answers_json INTO v_answer_json FROM answers 
    WHERE room_id = p_room_id 
      AND round_number = p_round_number 
      AND player_id = v_player.id
      AND game_id = v_game_id;

    IF v_answer_json IS NOT NULL THEN
      FOREACH v_category IN ARRAY v_categories LOOP
        v_answer_text := trim(lower(v_answer_json->>v_category));
        
        IF v_answer_text != '' AND left(v_answer_text, 1) = lower(v_current_letter) THEN
          -- Veto kontrolü (game_id ile)
          SELECT count(*) INTO v_vote_count FROM votes 
          WHERE room_id = p_room_id 
            AND round_number = p_round_number 
            AND target_player_id = v_player.id 
            AND category = v_category 
            AND is_veto = true
            AND game_id = v_game_id;
            
          IF v_vote_count <= (v_total_players / 2) THEN
            -- Tekrar kontrolü (game_id ile)
            SELECT count(*) INTO v_duplicate_count FROM answers a
            WHERE a.room_id = p_room_id 
              AND a.round_number = p_round_number
              AND a.game_id = v_game_id
              AND trim(lower(a.answers_json->>v_category)) = v_answer_text;
               
            IF v_duplicate_count > 1 THEN 
              v_round_score := v_round_score + 5;
            ELSE 
              v_round_score := v_round_score + 10; 
            END IF;
          END IF;
        END IF;
      END LOOP;
      
      UPDATE players SET score = score + v_round_score WHERE id = v_player.id;
    END IF;
  END LOOP;

  -- Başarılı hesaplama sonrası işaretle
  UPDATE rooms SET last_scored_round = p_round_number WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. toggle_vote_secure fonksiyonunu güncelle (game_id ile)
CREATE OR REPLACE FUNCTION toggle_vote_secure(
  p_room_id uuid,
  p_round_number integer,
  p_voter_id uuid,
  p_target_player_id uuid,
  p_category text,
  p_game_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_existing_id uuid;
  v_actual_game_id uuid;
BEGIN
  -- Eğer game_id parametre olarak verilmediyse, odadan al
  IF p_game_id IS NULL THEN
    SELECT current_game_id INTO v_actual_game_id FROM rooms WHERE id = p_room_id;
  ELSE
    v_actual_game_id := p_game_id;
  END IF;

  SELECT id INTO v_existing_id FROM votes 
  WHERE room_id = p_room_id 
    AND round_number = p_round_number 
    AND voter_id = p_voter_id 
    AND target_player_id = p_target_player_id 
    AND category = p_category
    AND game_id = v_actual_game_id;

  IF v_existing_id IS NOT NULL THEN
    DELETE FROM votes WHERE id = v_existing_id;
  ELSE
    INSERT INTO votes (room_id, round_number, voter_id, target_player_id, category, is_veto, game_id)
    VALUES (p_room_id, p_round_number, p_voter_id, p_target_player_id, p_category, true, v_actual_game_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- MIGRATION TAMAMLANDI
-- =====================================================
