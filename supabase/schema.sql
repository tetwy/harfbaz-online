-- =====================================================
-- HARFBAZ: DATABASE SCHEMA & MIGRATIONS
-- =====================================================
-- Supabase Dashboard > SQL Editor'da sırasıyla çalıştırın
-- =====================================================

-- =====================================================
-- 1. TABLOLAR
-- =====================================================

-- Rooms tablosu
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  status text DEFAULT 'LOBBY',
  current_letter text,
  current_round integer DEFAULT 1,
  voting_category_index integer DEFAULT 0,
  used_letters text[] DEFAULT '{}',
  revealed_players text[] DEFAULT '{}',
  settings jsonb DEFAULT '{"roundDuration": 60, "totalRounds": 5, "isHiddenMode": false}',
  round_start_time timestamptz,
  last_scored_round integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Players tablosu
CREATE TABLE IF NOT EXISTS public.players (
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
CREATE TABLE IF NOT EXISTS public.answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  answers_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, player_id, round_number)
);

-- Votes tablosu  
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  voter_id uuid REFERENCES players(id) ON DELETE CASCADE,
  target_player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  category text NOT NULL,
  is_veto boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. INDEXLER (Performans)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_answers_room_round ON answers(room_id, round_number);
CREATE INDEX IF NOT EXISTS idx_votes_room_round ON votes(room_id, round_number);

-- =====================================================
-- 3. ROOM CODE GENERATOR FUNCTION
-- =====================================================

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
-- 4. TOGGLE VOTE RPC (Güvenli oy verme)
-- =====================================================

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
  SELECT id INTO v_existing_id FROM votes 
  WHERE room_id = p_room_id 
    AND round_number = p_round_number 
    AND voter_id = p_voter_id 
    AND target_player_id = p_target_player_id 
    AND category = p_category;

  IF v_existing_id IS NOT NULL THEN
    DELETE FROM votes WHERE id = v_existing_id;
  ELSE
    INSERT INTO votes (room_id, round_number, voter_id, target_player_id, category, is_veto)
    VALUES (p_room_id, p_round_number, p_voter_id, p_target_player_id, p_category, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 5. CALCULATE SCORES RPC (İdempotent puan hesaplama)
-- =====================================================

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
  SELECT last_scored_round INTO v_last_scored FROM rooms WHERE id = p_room_id;
  IF v_last_scored >= p_round_number THEN
    RETURN; -- Bu tur zaten hesaplandı
  END IF;

  SELECT current_letter INTO v_current_letter FROM rooms WHERE id = p_room_id;
  SELECT count(*) INTO v_total_players FROM players WHERE room_id = p_room_id;

  IF v_current_letter IS NULL THEN RETURN; END IF;

  FOR v_player IN SELECT * FROM players WHERE room_id = p_room_id LOOP
    v_round_score := 0;
    SELECT answers_json INTO v_answer_json FROM answers 
    WHERE room_id = p_room_id AND round_number = p_round_number AND player_id = v_player.id;

    IF v_answer_json IS NOT NULL THEN
      FOREACH v_category IN ARRAY v_categories LOOP
        v_answer_text := trim(lower(v_answer_json->>v_category));
        
        IF v_answer_text != '' AND left(v_answer_text, 1) = lower(v_current_letter) THEN
          SELECT count(*) INTO v_vote_count FROM votes 
          WHERE room_id = p_room_id AND round_number = p_round_number 
            AND target_player_id = v_player.id AND category = v_category AND is_veto = true;
            
          IF v_vote_count <= (v_total_players / 2) THEN
             SELECT count(*) INTO v_duplicate_count FROM answers a
             WHERE a.room_id = p_room_id AND a.round_number = p_round_number
               AND trim(lower(a.answers_json->>v_category)) = v_answer_text;
               
             IF v_duplicate_count > 1 THEN v_round_score := v_round_score + 5;
             ELSE v_round_score := v_round_score + 10; END IF;
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

-- =====================================================
-- 6. REALTIME SUBSCRIPTIONS (Supabase Dashboard'dan aktif edin)
-- =====================================================
-- Supabase Dashboard > Database > Replication sayfasından
-- rooms, players, votes, answers tablolarını realtime'a ekleyin

-- =====================================================
-- 7. ROW LEVEL SECURITY (Opsiyonel - Güvenlik)
-- =====================================================
-- Aşağıdaki politikalar isteğe bağlıdır. 
-- Anon erişimi için tablo bazlı ayarlarınızı yapın.

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Herkese okuma/yazma izni (oyun için gerekli)
CREATE POLICY "Allow all" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all" ON players FOR ALL USING (true);
CREATE POLICY "Allow all" ON answers FOR ALL USING (true);
CREATE POLICY "Allow all" ON votes FOR ALL USING (true);
