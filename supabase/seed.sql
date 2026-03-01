-- =============================================
-- Seed: Dados iniciais Bela Orsine Beauty
-- =============================================

-- Working Hours (Seg-Sab 9h-19h, Domingo fechado)
INSERT INTO working_hours (day_of_week, start_time, end_time, is_active) VALUES
  (0, '09:00', '19:00', false),  -- Domingo (fechado)
  (1, '09:00', '19:00', true),   -- Segunda
  (2, '09:00', '19:00', true),   -- Terca
  (3, '09:00', '19:00', true),   -- Quarta
  (4, '09:00', '19:00', true),   -- Quinta
  (5, '09:00', '19:00', true),   -- Sexta
  (6, '09:00', '19:00', true);   -- Sabado

-- Categories
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
  ('Sobrancelha', 'sobrancelha', 'Design, henna e micropigmentacao de sobrancelhas', true, 1),
  ('Unhas', 'unhas', 'Manicure, pedicure, alongamento e esmaltacao', true, 2),
  ('Depilacao', 'depilacao', 'Depilacao com cera e outros metodos', true, 3);

-- Services (using category IDs from above)
INSERT INTO services (category_id, name, description, duration_minutes, price, is_active, sort_order)
SELECT c.id, s.name, s.description, s.duration_minutes, s.price, true, s.sort_order
FROM (VALUES
  ('sobrancelha', 'Design de Sobrancelha', 'Design personalizado para realcar o olhar', 40, 80.00, 1),
  ('sobrancelha', 'Henna de Sobrancelha', 'Aplicacao de henna para preenchimento natural', 40, 60.00, 2),
  ('sobrancelha', 'Design + Henna', 'Combo design com aplicacao de henna', 50, 120.00, 3),
  ('unhas', 'Manicure', 'Cuidado completo das unhas das maos', 40, 50.00, 1),
  ('unhas', 'Pedicure', 'Cuidado completo das unhas dos pes', 40, 55.00, 2),
  ('unhas', 'Manicure + Pedicure', 'Combo completo maos e pes', 80, 95.00, 3),
  ('unhas', 'Esmaltacao em Gel', 'Esmaltacao com durabilidade de ate 3 semanas', 50, 70.00, 4),
  ('depilacao', 'Meia Perna', 'Depilacao com cera meia perna', 30, 40.00, 1),
  ('depilacao', 'Perna Inteira', 'Depilacao com cera perna inteira', 40, 65.00, 2),
  ('depilacao', 'Axila', 'Depilacao com cera nas axilas', 20, 30.00, 3),
  ('depilacao', 'Virilha', 'Depilacao com cera virilha', 30, 50.00, 4)
) AS s(category_slug, name, description, duration_minutes, price, sort_order)
JOIN categories c ON c.slug = s.category_slug;

-- Settings
INSERT INTO settings (key, value) VALUES
  ('cancellation_policy_hours', '24'),
  ('default_slot_duration', '40'),
  ('feedback_delay_minutes', '60'),
  ('loyalty_enabled', 'true'),
  ('business_name', '"Bela Orsine Beauty"'),
  ('business_phone', '"(00) 00000-0000"'),
  ('business_address', '""'),
  ('social_instagram', '"@belaorsine"'),
  ('google_calendar_id', '"primary"');

-- Loyalty Rules (default)
INSERT INTO loyalty_rules (name, type, points_per_visit, points_threshold, discount_value, discount_percent, is_active) VALUES
  ('Pontos por atendimento', 'earn', 10, 0, 0, 0, true),
  ('Desconto fidelidade', 'redeem', 0, 100, 20.00, 0, true);
