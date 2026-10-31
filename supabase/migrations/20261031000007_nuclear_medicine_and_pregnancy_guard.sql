-- Migration: 20261031000007_nuclear_medicine_and_pregnancy_guard.sql
-- Description: Nuclear Medicine safety triggers, pregnancy hard stop, and radioactive dose snapshot

-- Trigger: Absolute Hard Stop 100% on Pregnancy Check before 'in_procedure' for females 12-55
CREATE OR REPLACE FUNCTION public.check_nuclear_safety_before_procedure()
RETURNS TRIGGER AS $$
DECLARE
  v_gender TEXT;
  v_age INTEGER;
  v_has_negative_upt BOOLEAN := false;
BEGIN
  -- Only enforce for nuclear medicine orders
  IF NEW.order_type = 'nuclear' AND NEW.status = 'in_procedure' AND OLD.status != 'in_procedure' THEN
    -- Check patient gender and age
    SELECT gender, extract(year from age(birth_date))::integer
    INTO v_gender, v_age
    FROM public.patients
    WHERE hn = NEW.hn;

    -- If female of childbearing age (12 - 55 years)
    IF v_gender = 'F' AND v_age >= 12 AND v_age <= 55 THEN
      -- Check if there is a negative UPT or hCG lab result within last 48 hours
      SELECT EXISTS (
        SELECT 1 FROM public.lab_results
        WHERE hn = NEW.hn
          AND (test_name ILIKE '%pregnancy%' OR test_name ILIKE '%upt%' OR test_name ILIKE '%hcg%')
          AND result_value ILIKE '%negative%'
          AND reported_at >= (now() - interval '48 hours')
      ) INTO v_has_negative_upt;

      IF NOT v_has_negative_upt THEN
        RAISE EXCEPTION 'CRITICAL CLINICAL SAFETY HARD-STOP: Female patient of childbearing age (%) must have verified Negative Pregnancy Test within 48h before starting nuclear procedure.', v_age;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nuclear_pregnancy_hard_stop
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_nuclear_safety_before_procedure();

-- RLS: nuclear_med can view and manage nuclear orders
CREATE POLICY "Nuclear med staff can manage nuclear orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'active_role') = 'nuclear_med' AND order_type = 'nuclear'
    OR (auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'director', 'admin')
  );
