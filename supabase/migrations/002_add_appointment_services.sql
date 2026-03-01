-- =====================================================
-- Migration 002: Suporte a multiplos servicos por agendamento (carrinho)
-- =====================================================

-- 1. Tabela junction: appointment_services
CREATE TABLE appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price_at_booking DECIMAL(10, 2) NOT NULL,
  duration_at_booking INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, service_id)
);

CREATE INDEX idx_appt_services_appointment ON appointment_services(appointment_id);
CREATE INDEX idx_appt_services_service ON appointment_services(service_id);

-- 2. Tornar service_id nullable e adicionar total_duration em appointments
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE appointments ADD COLUMN total_duration INTEGER;

-- 3. RLS policies para appointment_services
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes veem seus proprios servicos de agendamento"
  ON appointment_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_services.appointment_id
        AND appointments.client_id = auth.uid()
    )
  );

CREATE POLICY "Clientes inserem servicos nos proprios agendamentos"
  ON appointment_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_services.appointment_id
        AND appointments.client_id = auth.uid()
    )
  );

CREATE POLICY "Admin gerencia todos servicos de agendamento"
  ON appointment_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Migrar dados existentes (appointments com service_id) para junction table
INSERT INTO appointment_services (appointment_id, service_id, price_at_booking, duration_at_booking)
SELECT
  a.id,
  a.service_id,
  COALESCE(a.amount_paid, s.price),
  s.duration_minutes
FROM appointments a
JOIN services s ON s.id = a.service_id
WHERE a.service_id IS NOT NULL;

-- 5. Atualizar total_duration nos appointments existentes
UPDATE appointments a
SET total_duration = s.duration_minutes
FROM services s
WHERE s.id = a.service_id
  AND a.service_id IS NOT NULL;
