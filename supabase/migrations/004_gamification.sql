-- =====================================================
-- Migration 004: Gamification system
-- Moedas de jogo, minigames, conquistas, loja de recompensas
-- =====================================================

-- ============================================================
-- 1. PROFILES: novos campos de gamificacao
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS game_coins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkin_date DATE;

ALTER TABLE profiles
  ADD CONSTRAINT check_game_coins_non_negative CHECK (game_coins >= 0);

ALTER TABLE profiles
  ADD CONSTRAINT check_streak_non_negative CHECK (current_streak >= 0);

-- ============================================================
-- 2. GAME_COINS_HISTORY: historico de transacoes de moedas
-- ============================================================

CREATE TABLE game_coins_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'expired', 'adjusted')),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN (
    'checkin', 'wheel', 'scratch', 'quiz', 'shake',
    'achievement', 'store', 'ranking', 'admin'
  )),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_coins_history_client
  ON game_coins_history(client_id, created_at DESC);

ALTER TABLE game_coins_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients see own coin history"
  ON game_coins_history FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Admin full access to coin history"
  ON game_coins_history FOR ALL
  USING (is_admin());

-- ============================================================
-- 3. MINIGAME_PLAYS: registro de jogadas e controle de cooldown
-- ============================================================

CREATE TABLE minigame_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('checkin', 'wheel', 'scratch', 'quiz', 'shake')),
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result JSONB DEFAULT '{}',
  coins_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_minigame_plays_client_type_date
  ON minigame_plays(client_id, game_type, (played_at::date));

-- Prevent multiple plays of the same game on the same day
CREATE UNIQUE INDEX idx_minigame_plays_daily_limit
  ON minigame_plays(client_id, game_type, (played_at::date));

ALTER TABLE minigame_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients see own plays"
  ON minigame_plays FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Admin full access to plays"
  ON minigame_plays FOR ALL
  USING (is_admin());

-- ============================================================
-- 4. ACHIEVEMENTS: definicoes de conquistas
-- ============================================================

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL CHECK (category IN ('streak', 'games', 'spending', 'social')),
  condition_type TEXT NOT NULL,
  condition_value JSONB NOT NULL DEFAULT '{}',
  coin_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Admin full access to achievements"
  ON achievements FOR ALL
  USING (is_admin());

-- ============================================================
-- 5. USER_ACHIEVEMENTS: conquistas desbloqueadas
-- ============================================================

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, achievement_id)
);

CREATE INDEX idx_user_achievements_client
  ON user_achievements(client_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients see own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Admin full access to user achievements"
  ON user_achievements FOR ALL
  USING (is_admin());

-- ============================================================
-- 6. REWARD_STORE_ITEMS: catalogo da loja de recompensas
-- ============================================================

CREATE TABLE reward_store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('discount', 'service', 'product')),
  coin_price INTEGER NOT NULL CHECK (coin_price > 0),
  metadata JSONB NOT NULL DEFAULT '{}',
  stock INTEGER, -- null = ilimitado
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reward_store_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store items"
  ON reward_store_items FOR SELECT
  USING (true);

CREATE POLICY "Admin full access to store items"
  ON reward_store_items FOR ALL
  USING (is_admin());

-- ============================================================
-- 7. REWARD_REDEMPTIONS: trocas realizadas
-- ============================================================

CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES reward_store_items(id) ON DELETE RESTRICT,
  coins_spent INTEGER NOT NULL CHECK (coins_spent > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  fulfilled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reward_redemptions_client
  ON reward_redemptions(client_id, status);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients see own redemptions"
  ON reward_redemptions FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Admin full access to redemptions"
  ON reward_redemptions FOR ALL
  USING (is_admin());

-- ============================================================
-- 8. GAME_CONFIG: configuracoes admin dos jogos
-- ============================================================

CREATE TABLE game_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL UNIQUE CHECK (game_type IN ('checkin', 'wheel', 'scratch', 'quiz', 'shake')),
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game config"
  ON game_config FOR SELECT
  USING (true);

CREATE POLICY "Admin full access to game config"
  ON game_config FOR ALL
  USING (is_admin());

-- ============================================================
-- 9. QUIZ_QUESTIONS: banco de perguntas
-- ============================================================

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- array of strings
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0),
  category TEXT NOT NULL DEFAULT 'geral',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions"
  ON quiz_questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to questions"
  ON quiz_questions FOR ALL
  USING (is_admin());

-- ============================================================
-- 10. RPCs ATOMICAS
-- ============================================================

-- 10.1 Award game coins (creditar moedas)
CREATE OR REPLACE FUNCTION award_game_coins(
  p_client_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  END IF;

  -- Update profile coins
  UPDATE profiles
  SET game_coins = game_coins + p_amount
  WHERE id = p_client_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  -- Insert history
  INSERT INTO game_coins_history (client_id, type, amount, source, description, metadata)
  VALUES (p_client_id, 'earned', p_amount, p_source, p_description, p_metadata);

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$;

-- 10.2 Spend game coins (debitar moedas com lock)
CREATE OR REPLACE FUNCTION spend_game_coins(
  p_client_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT,
  p_item_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_coins INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  END IF;

  -- Lock the profile row
  SELECT game_coins INTO v_current_coins
  FROM profiles
  WHERE id = p_client_id
  FOR UPDATE;

  IF v_current_coins IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  IF v_current_coins < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_COINS');
  END IF;

  -- Deduct coins
  UPDATE profiles
  SET game_coins = game_coins - p_amount
  WHERE id = p_client_id;

  -- Insert history
  INSERT INTO game_coins_history (client_id, type, amount, source, description, metadata)
  VALUES (
    p_client_id, 'spent', -p_amount, p_source, p_description,
    CASE WHEN p_item_id IS NOT NULL
      THEN jsonb_build_object('item_id', p_item_id)
      ELSE '{}'::jsonb
    END
  );

  RETURN jsonb_build_object('success', true, 'remaining', v_current_coins - p_amount);
END;
$$;

-- 10.3 Daily check-in (atomico)
CREATE OR REPLACE FUNCTION daily_checkin(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_checkin DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_base_coins INTEGER := 5;
  v_bonus_coins INTEGER := 0;
  v_total_coins INTEGER;
  v_today DATE := CURRENT_DATE;
  v_config JSONB;
BEGIN
  -- Lock profile row
  SELECT last_checkin_date, current_streak INTO v_last_checkin, v_current_streak
  FROM profiles
  WHERE id = p_client_id
  FOR UPDATE;

  IF v_last_checkin IS NULL AND v_current_streak IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  -- Check if already checked in today
  IF v_last_checkin = v_today THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CHECKED_IN');
  END IF;

  -- Load config for base coins
  SELECT config INTO v_config FROM game_config WHERE game_type = 'checkin' AND is_active = true;
  IF v_config IS NOT NULL AND v_config ? 'base_coins' THEN
    v_base_coins := (v_config->>'base_coins')::integer;
  END IF;

  -- Calculate streak
  IF v_last_checkin = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken or first time
    v_new_streak := 1;
  END IF;

  -- Streak bonus: every 7 days, big bonus
  IF v_new_streak % 7 = 0 THEN
    v_bonus_coins := 50;
  ELSIF v_new_streak > 1 THEN
    -- Progressive: streak day * base (capped at base * 6)
    v_bonus_coins := LEAST(v_new_streak - 1, 6) * 2;
  END IF;

  v_total_coins := v_base_coins + v_bonus_coins;

  -- Update profile
  UPDATE profiles
  SET game_coins = game_coins + v_total_coins,
      current_streak = v_new_streak,
      longest_streak = GREATEST(longest_streak, v_new_streak),
      last_checkin_date = v_today
  WHERE id = p_client_id;

  -- Insert play record
  INSERT INTO minigame_plays (client_id, game_type, played_at, result, coins_earned)
  VALUES (
    p_client_id, 'checkin', now(),
    jsonb_build_object('streak', v_new_streak, 'bonus', v_bonus_coins),
    v_total_coins
  );

  -- Insert coin history
  INSERT INTO game_coins_history (client_id, type, amount, source, description, metadata)
  VALUES (
    p_client_id, 'earned', v_total_coins, 'checkin',
    'Check-in diario (dia ' || v_new_streak || ')',
    jsonb_build_object('streak', v_new_streak, 'base', v_base_coins, 'bonus', v_bonus_coins)
  );

  RETURN jsonb_build_object(
    'success', true,
    'coins_earned', v_total_coins,
    'streak', v_new_streak,
    'bonus', v_bonus_coins,
    'base', v_base_coins
  );
END;
$$;

-- 10.4 Play minigame (registra jogada + credita moedas atomicamente)
CREATE OR REPLACE FUNCTION play_minigame(
  p_client_id UUID,
  p_game_type TEXT,
  p_coins_earned INTEGER,
  p_result JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_already_played BOOLEAN;
  v_game_active BOOLEAN;
BEGIN
  -- Check if game is active
  SELECT is_active INTO v_game_active
  FROM game_config
  WHERE game_type = p_game_type;

  IF v_game_active IS NOT NULL AND NOT v_game_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'GAME_DISABLED');
  END IF;

  -- Check if already played today
  SELECT EXISTS (
    SELECT 1 FROM minigame_plays
    WHERE client_id = p_client_id
      AND game_type = p_game_type
      AND played_at::date = v_today
  ) INTO v_already_played;

  IF v_already_played THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_PLAYED_TODAY');
  END IF;

  -- Clamp coins to valid range
  IF p_coins_earned < 0 THEN
    p_coins_earned := 0;
  END IF;

  -- Award coins if any
  IF p_coins_earned > 0 THEN
    UPDATE profiles
    SET game_coins = game_coins + p_coins_earned
    WHERE id = p_client_id;

    INSERT INTO game_coins_history (client_id, type, amount, source, description, metadata)
    VALUES (
      p_client_id, 'earned', p_coins_earned, p_game_type,
      'Minigame: ' || p_game_type,
      p_result
    );
  END IF;

  -- Record play
  INSERT INTO minigame_plays (client_id, game_type, played_at, result, coins_earned)
  VALUES (p_client_id, p_game_type, now(), p_result, p_coins_earned);

  RETURN jsonb_build_object(
    'success', true,
    'coins_earned', p_coins_earned,
    'result', p_result
  );
END;
$$;

-- ============================================================
-- 11. DEFAULT GAME CONFIGS (seeds)
-- ============================================================

INSERT INTO game_config (game_type, config, is_active) VALUES
('checkin', '{
  "base_coins": 5,
  "streak_bonus_interval": 7,
  "streak_bonus_amount": 50,
  "progressive_bonus_per_day": 2,
  "max_progressive_bonus_days": 6
}'::jsonb, true),

('wheel', '{
  "segments": [
    {"label": "2 moedas", "coins": 2, "weight": 25, "color": "#f43f5e"},
    {"label": "5 moedas", "coins": 5, "weight": 25, "color": "#ec4899"},
    {"label": "10 moedas", "coins": 10, "weight": 20, "color": "#f43f5e"},
    {"label": "15 moedas", "coins": 15, "weight": 12, "color": "#ec4899"},
    {"label": "25 moedas", "coins": 25, "weight": 8, "color": "#f43f5e"},
    {"label": "50 moedas", "coins": 50, "weight": 3, "color": "#ec4899"},
    {"label": "Tente amanha", "coins": 0, "weight": 5, "color": "#6b7280"},
    {"label": "1 moeda", "coins": 1, "weight": 2, "color": "#eab308"}
  ]
}'::jsonb, true),

('scratch', '{
  "prizes": [
    {"symbols": 3, "label": "Jackpot!", "coins": 30, "weight": 5},
    {"symbols": 2, "label": "Quase la!", "coins": 10, "weight": 25},
    {"symbols": 1, "label": "Consolacao", "coins": 3, "weight": 40},
    {"symbols": 0, "label": "Tente amanha", "coins": 1, "weight": 30}
  ],
  "symbol_options": ["star", "heart", "diamond", "flower", "crown"]
}'::jsonb, true),

('quiz', '{
  "time_limit_seconds": 15,
  "correct_coins": 15,
  "wrong_coins": 2,
  "timeout_coins": 0
}'::jsonb, true),

('shake', '{
  "min_coins": 1,
  "max_coins": 15,
  "weights": [
    {"range": [1, 3], "weight": 35},
    {"range": [4, 7], "weight": 30},
    {"range": [8, 12], "weight": 25},
    {"range": [13, 15], "weight": 10}
  ]
}'::jsonb, true)

ON CONFLICT (game_type) DO NOTHING;

-- ============================================================
-- 12. DEFAULT ACHIEVEMENTS (seeds)
-- ============================================================

INSERT INTO achievements (slug, name, description, icon, category, condition_type, condition_value, coin_reward, sort_order) VALUES
-- Streak achievements
('streak_7', 'Fiel', 'Faca check-in por 7 dias seguidos', 'flame', 'streak', 'streak_days', '{"days": 7}', 50, 1),
('streak_30', 'Dedicada', 'Faca check-in por 30 dias seguidos', 'fire', 'streak', 'streak_days', '{"days": 30}', 200, 2),
('streak_100', 'Incansavel', 'Faca check-in por 100 dias seguidos', 'zap', 'streak', 'streak_days', '{"days": 100}', 500, 3),

-- Games achievements
('first_game', 'Primeira Vitoria', 'Jogue seu primeiro minigame', 'gamepad-2', 'games', 'total_games', '{"count": 1}', 10, 10),
('all_games_day', 'Viciada', 'Jogue todos os minigames no mesmo dia', 'trophy', 'games', 'all_games_in_day', '{}', 30, 11),
('jackpot_wheel', 'Sortuda', 'Ganhe o premio maximo na roleta', 'sparkles', 'games', 'wheel_jackpot', '{}', 100, 12),
('games_50', 'Gamer', 'Jogue 50 minigames no total', 'medal', 'games', 'total_games', '{"count": 50}', 75, 13),

-- Spending achievements
('first_redeem', 'Primeira Troca', 'Faca sua primeira troca na loja', 'shopping-bag', 'spending', 'total_redeems', '{"count": 1}', 15, 20),
('redeems_10', 'VIP', 'Faca 10 trocas na loja', 'crown', 'spending', 'total_redeems', '{"count": 10}', 100, 21),

-- Social achievements
('reviews_5', 'Avaliadora', 'Faca 5 avaliacoes de atendimento', 'message-circle', 'social', 'total_reviews', '{"count": 5}', 50, 30),
('appointments_10', 'Frequentadora', 'Complete 10 agendamentos', 'calendar-check', 'social', 'total_appointments', '{"count": 10}', 75, 31),
('coins_1000', 'Rica', 'Acumule 1000 moedas no total', 'coins', 'spending', 'total_coins_earned', '{"amount": 1000}', 100, 22)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 13. QUIZ QUESTIONS SEED (initial batch)
-- ============================================================

INSERT INTO quiz_questions (question, options, correct_index, category, difficulty) VALUES
('Qual vitamina e essencial para a saude da pele?', '["Vitamina A", "Vitamina C", "Vitamina D", "Vitamina K"]', 1, 'pele', 'easy'),
('Com que frequencia devemos trocar a esponja de maquiagem?', '["Todo mes", "A cada 3 meses", "A cada 6 meses", "Todo ano"]', 1, 'maquiagem', 'medium'),
('Qual o pH ideal da pele saudavel?', '["3.0 - 4.0", "4.5 - 5.5", "6.0 - 7.0", "7.5 - 8.5"]', 1, 'pele', 'hard'),
('Qual ingrediente ajuda a combater olheiras?', '["Retinol", "Acido hialuronico", "Vitamina K", "Niacinamida"]', 2, 'pele', 'medium'),
('Qual a ordem correta de cuidados com a pele?', '["Hidratante, limpeza, tonico", "Limpeza, tonico, hidratante", "Tonico, hidratante, limpeza", "Limpeza, hidratante, tonico"]', 1, 'pele', 'easy'),
('Protetor solar deve ser reaplicado a cada quantas horas?', '["1 hora", "2 horas", "4 horas", "6 horas"]', 1, 'pele', 'easy'),
('Qual o principal beneficio do acido hialuronico?', '["Clareamento", "Hidratacao profunda", "Esfoliacao", "Protecao solar"]', 1, 'pele', 'easy'),
('O que e balayage?', '["Tipo de corte", "Tecnica de coloracao", "Tratamento capilar", "Tipo de escova"]', 1, 'cabelo', 'medium'),
('Qual oleo e mais indicado para hidratar as unhas?', '["Oleo de coco", "Oleo mineral", "Oleo de ricino", "Oleo de amendoa"]', 0, 'unhas', 'medium'),
('Qual o tempo ideal de uma mascara facial?', '["5 minutos", "10-15 minutos", "30 minutos", "1 hora"]', 1, 'pele', 'easy'),
('O que e um primer?', '["Base de maquiagem", "Preparador de pele pre-maquiagem", "Demaquilante", "Protetor solar colorido"]', 1, 'maquiagem', 'easy'),
('Qual tipo de escova e ideal para cabelos cacheados?', '["Escova redonda", "Pente garfo", "Escova raquete", "Escova termica"]', 1, 'cabelo', 'medium'),
('Qual a funcao do tonico facial?', '["Hidratar", "Equilibrar o pH da pele", "Remover maquiagem", "Proteger do sol"]', 1, 'pele', 'easy'),
('De quanto em quanto tempo devemos cortar as pontas do cabelo?', '["Todo mes", "A cada 2-3 meses", "A cada 6 meses", "Apenas quando necessario"]', 1, 'cabelo', 'easy'),
('Qual ativo e conhecido como "ouro da skincare"?', '["Retinol", "Vitamina C", "Niacinamida", "Acido glicolico"]', 0, 'pele', 'hard'),
('Qual a melhor forma de secar o rosto apos lavar?', '["Esfregar com toalha", "Secar ao ar livre", "Pressionar suavemente com toalha", "Usar secador"]', 2, 'pele', 'easy'),
('O que e micropigmentacao?', '["Tatuagem temporaria", "Implante de pigmento na pele", "Tipo de maquiagem", "Procedimento a laser"]', 1, 'procedimentos', 'medium'),
('Qual nutriente fortalece as unhas?', '["Ferro", "Biotina", "Calcio", "Zinco"]', 1, 'unhas', 'medium'),
('Lavar o cabelo todo dia faz mal?', '["Sim, sempre", "Nao, nunca", "Depende do tipo de cabelo", "Apenas no inverno"]', 2, 'cabelo', 'easy'),
('O que e peeling quimico?', '["Esfoliacao mecanica", "Aplicacao de acidos para renovacao celular", "Limpeza profunda", "Hidratacao intensiva"]', 1, 'procedimentos', 'medium')

ON CONFLICT DO NOTHING;
