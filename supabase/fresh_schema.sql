-- =====================================================
-- HARFBAZ: TAM VERİTABANI ŞEMASI (v2.0)
-- =====================================================
-- Bu dosya tüm tabloları, fonksiyonları ve izinleri içerir
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- =====================================================

-- 1. ÖNCEKİ TABLOLARI SİL (temiz başlangıç)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- 1b. ÖNCEKİ FONKSİYONLARI SİL
DROP FUNCTION IF EXISTS toggle_vote_secure(uuid, integer, uuid, uuid, text);
DROP FUNCTION IF EXISTS toggle_vote_secure(uuid, integer, uuid, uuid, text, uuid);
DROP FUNCTION IF EXISTS calculate_round_scores(uuid, integer);
DROP FUNCTION IF EXISTS handle_player_exit();
DROP FUNCTION IF EXISTS generate_room_code();

-- 2. TABLOLAR
-- =====================================================

-- Rooms tablosu
CREATE TABLE public.rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  status text DEFAULT 'LOBBY',
  current_letter text,
  current_round integer DEFAULT 1,
  current_game_id uuid DEFAULT gen_random_uuid(),
  voting_category_index integer DEFAULT 0,
  used_letters text[] DEFAULT '{}',
  revealed_players text[] DEFAULT '{}',
  settings jsonb DEFAULT '{"roundDuration": 60, "totalRounds": 5, "isHiddenMode": false}',
  round_start_time timestamptz,
  last_scored_round integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Players tablosu
CREATE TABLE public.players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar text NOT NULL,
  is_host boolean DEFAULT false,
  score integer DEFAULT 0,
  is_ready boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Answers tablosu
CREATE TABLE public.answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  game_id uuid,
  answers_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, player_id, round_number)
);

-- Votes tablosu  
CREATE TABLE public.votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  voter_id uuid REFERENCES players(id) ON DELETE CASCADE,
  target_player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  game_id uuid,
  category text NOT NULL,
  is_veto boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. INDEXLER
-- =====================================================

CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_answers_room_round ON answers(room_id, round_number);
CREATE INDEX idx_answers_game_id ON answers(game_id);
CREATE INDEX idx_votes_room_round ON votes(room_id, round_number);
CREATE INDEX idx_votes_game_id ON votes(game_id);

-- 4. RLS (Row Level Security) - TAM İZİN
-- =====================================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Tüm tablolar için TAM ERİŞİM (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "rooms_full_access" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "players_full_access" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "answers_full_access" ON answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "votes_full_access" ON votes FOR ALL USING (true) WITH CHECK (true);

-- 5. FONKSİYONLAR
-- =====================================================

-- Toggle Vote (güvenli oy verme)
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

-- Calculate Scores (puan hesaplama - game_id ile)
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
  -- İdempotency kontrolü ve verileri al
  SELECT last_scored_round, current_letter, current_game_id 
  INTO v_last_scored, v_current_letter, v_game_id 
  FROM rooms WHERE id = p_room_id;
  
  IF v_last_scored >= p_round_number THEN
    RETURN;
  END IF;

  IF v_current_letter IS NULL OR v_game_id IS NULL THEN RETURN; END IF;

  SELECT count(*) INTO v_total_players FROM players WHERE room_id = p_room_id;

  FOR v_player IN SELECT * FROM players WHERE room_id = p_room_id LOOP
    v_round_score := 0;
    
    SELECT answers_json INTO v_answer_json FROM answers 
    WHERE room_id = p_room_id 
      AND round_number = p_round_number 
      AND player_id = v_player.id
      AND game_id = v_game_id;

    IF v_answer_json IS NOT NULL THEN
      FOREACH v_category IN ARRAY v_categories LOOP
        v_answer_text := trim(lower(v_answer_json->>v_category));
        
        IF v_answer_text != '' AND left(v_answer_text, 1) = lower(v_current_letter) THEN
          SELECT count(*) INTO v_vote_count FROM votes 
          WHERE room_id = p_room_id 
            AND round_number = p_round_number 
            AND target_player_id = v_player.id 
            AND category = v_category 
            AND is_veto = true
            AND game_id = v_game_id;
            
          IF v_vote_count <= (v_total_players / 2) THEN
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

  UPDATE rooms SET last_scored_round = p_round_number WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. REALTIME (Dashboard'dan aktif edin)
-- =====================================================
-- Supabase Dashboard > Database > Replication
-- rooms, players, votes, answers tablolarını ekleyin

-- =====================================================
-- KURULUM TAMAMLANDI
-- =====================================================
-- Dashboard > Authentication > Settings:
-- "Allow anonymous sign-ins" aktif edin
-- =====================================================
