-- =====================================================
-- Migration 003: Security fixes, constraints, indexes, and atomic RPCs
-- =====================================================

-- ============================================================
-- 1. CHECK CONSTRAINTS (data integrity)
-- ============================================================

-- Appointments: start_time must be before end_time
ALTER TABLE appointments
  ADD CONSTRAINT check_appt_start_before_end
  CHECK (start_time < end_time);

-- Appointments: amount_paid must be non-negative
ALTER TABLE appointments
  ADD CONSTRAINT check_appt_amount_non_negative
  CHECK (amount_paid >= 0);

-- Appointments: discount must be non-negative
ALTER TABLE appointments
  ADD CONSTRAINT check_appt_discount_non_negative
  CHECK (discount_applied >= 0);

-- Loyalty rules: points must be non-negative
ALTER TABLE loyalty_rules
  ADD CONSTRAINT check_loyalty_points_non_negative
  CHECK (points_per_visit >= 0);

ALTER TABLE loyalty_rules
  ADD CONSTRAINT check_loyalty_threshold_non_negative
  CHECK (points_threshold >= 0);

ALTER TABLE loyalty_rules
  ADD CONSTRAINT check_loyalty_discount_value_non_negative
  CHECK (discount_value >= 0);

ALTER TABLE loyalty_rules
  ADD CONSTRAINT check_loyalty_discount_percent_non_negative
  CHECK (discount_percent >= 0);

-- Profiles: loyalty_points must be non-negative (prevents over-redemption)
ALTER TABLE profiles
  ADD CONSTRAINT check_profile_loyalty_non_negative
  CHECK (loyalty_points >= 0);

-- Appointment services: price and duration must be positive
ALTER TABLE appointment_services
  ADD CONSTRAINT check_appt_svc_price_non_negative
  CHECK (price_at_booking >= 0);

ALTER TABLE appointment_services
  ADD CONSTRAINT check_appt_svc_duration_positive
  CHECK (duration_at_booking > 0);

-- Services: price and duration must be positive
ALTER TABLE services
  ADD CONSTRAINT check_service_price_non_negative
  CHECK (price >= 0);

ALTER TABLE services
  ADD CONSTRAINT check_service_duration_positive
  CHECK (duration_minutes > 0);

-- ============================================================
-- 2. COMPOSITE INDEXES (performance)
-- ============================================================

-- Availability queries: date + status + time
CREATE INDEX IF NOT EXISTS idx_appointments_date_status_time
  ON appointments(appointment_date, status, start_time)
  WHERE status NOT IN ('cancelled');

-- Client appointment history
CREATE INDEX IF NOT EXISTS idx_appointments_client_date
  ON appointments(client_id, appointment_date);

-- ============================================================
-- 3. EXCLUSION CONSTRAINT for double-booking prevention
-- Requires btree_gist extension for combining range exclusion with equality
-- ============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping appointments on the same date
-- This uses an exclusion constraint with time ranges
ALTER TABLE appointments
  ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    appointment_date WITH =,
    tsrange(
      ('2000-01-01'::date + start_time)::timestamp,
      ('2000-01-01'::date + end_time)::timestamp,
      '[)'
    ) WITH &&
  )
  WHERE (status NOT IN ('cancelled'));

-- ============================================================
-- 4. MISSING RLS POLICIES
-- ============================================================

-- Clients can update their own appointments (only pending/confirmed)
CREATE POLICY "Clients can update own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (
    auth.uid() = client_id
    AND status IN ('pending', 'confirmed')
  );

-- Clients can see their own payments (via appointment)
CREATE POLICY "Clients see own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = payments.appointment_id
        AND appointments.client_id = auth.uid()
    )
  );

-- Clients can see their own notifications (via appointment)
CREATE POLICY "Clients see own notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = notifications.appointment_id
        AND appointments.client_id = auth.uid()
    )
  );

-- ============================================================
-- 5. ATOMIC RPC: award_loyalty_points (transactional)
-- ============================================================

CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_appointment_id UUID,
  p_client_id UUID,
  p_amount_paid DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_earn_rule RECORD;
  v_points_earned INTEGER;
  v_unit_amount DECIMAL;
BEGIN
  -- Fetch active earn rule
  SELECT * INTO v_earn_rule
  FROM loyalty_rules
  WHERE type = 'earn' AND is_active = true
  LIMIT 1;

  IF v_earn_rule IS NULL THEN
    RETURN jsonb_build_object('pointsEarned', 0, 'message', 'No active earn rule');
  END IF;

  -- Calculate points: floor(amount / unitAmount) * pointsPerVisit
  v_unit_amount := GREATEST(COALESCE((v_earn_rule.points_threshold)::decimal, 10), 1);
  v_points_earned := FLOOR(p_amount_paid / v_unit_amount) * v_earn_rule.points_per_visit;

  IF v_points_earned <= 0 THEN
    RETURN jsonb_build_object('pointsEarned', 0, 'message', 'No points earned');
  END IF;

  -- Lock the profile row and update atomically
  UPDATE profiles
  SET loyalty_points = loyalty_points + v_points_earned,
      total_completed = total_completed + 1
  WHERE id = p_client_id;

  -- Update appointment with points earned
  UPDATE appointments
  SET points_earned = v_points_earned
  WHERE id = p_appointment_id;

  -- Insert loyalty history record
  INSERT INTO loyalty_history (client_id, appointment_id, type, points, description)
  VALUES (
    p_client_id,
    p_appointment_id,
    'earned',
    v_points_earned,
    'Pontos por atendimento concluido'
  );

  RETURN jsonb_build_object('pointsEarned', v_points_earned);
END;
$$;

-- ============================================================
-- 6. ATOMIC RPC: redeem_loyalty_points (transactional with row lock)
-- ============================================================

CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_client_id UUID,
  p_rule_id UUID,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule RECORD;
  v_current_points INTEGER;
  v_points_to_deduct INTEGER;
  v_discount_value DECIMAL;
BEGIN
  -- Fetch the redeem rule
  SELECT * INTO v_rule
  FROM loyalty_rules
  WHERE id = p_rule_id
    AND type = 'redeem'
    AND is_active = true;

  IF v_rule IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'RULE_NOT_FOUND');
  END IF;

  -- Lock the profile row to prevent race conditions
  SELECT loyalty_points INTO v_current_points
  FROM profiles
  WHERE id = p_client_id
  FOR UPDATE;

  IF v_current_points IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  v_points_to_deduct := v_rule.points_threshold;
  v_discount_value := v_rule.discount_value;

  -- Check sufficient points
  IF v_current_points < v_points_to_deduct THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_POINTS');
  END IF;

  -- Deduct points atomically
  UPDATE profiles
  SET loyalty_points = loyalty_points - v_points_to_deduct
  WHERE id = p_client_id;

  -- Insert loyalty history
  INSERT INTO loyalty_history (client_id, appointment_id, type, points, description)
  VALUES (
    p_client_id,
    p_appointment_id,
    'redeemed',
    -v_points_to_deduct,
    'Resgate: R$' || v_discount_value::text || ' de desconto'
  );

  RETURN jsonb_build_object(
    'success', true,
    'discountValue', v_discount_value,
    'pointsDeducted', v_points_to_deduct
  );
END;
$$;

-- ============================================================
-- 7. Helper function: is_admin (optimize repeated admin checks)
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
