-- Migration: 20261031000006_diagnostic_orders_and_lab_loopback.sql
-- Description: Orders table, lab_results, med_tech role segregation, and auto-loopback to doctor_review

CREATE TYPE order_type_enum AS ENUM ('lab', 'xray', 'nuclear');
CREATE TYPE order_status_enum AS ENUM ('ordered', 'scheduled', 'in_prep', 'in_procedure', 'result_pending', 'completed', 'cancelled');
CREATE TYPE payment_type_enum AS ENUM ('pre_paid', 'post_paid');

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  order_type order_type_enum NOT NULL,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  status order_status_enum NOT NULL DEFAULT 'ordered',
  payment_type payment_type_enum NOT NULL DEFAULT 'pre_paid',
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'exempted'
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ordered_by UUID REFERENCES auth.users(id),
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  test_name TEXT NOT NULL,
  result_value TEXT NOT NULL,
  reference_range TEXT,
  unit TEXT,
  flag TEXT, -- 'normal', 'high', 'low', 'critical'
  reported_by UUID REFERENCES auth.users(id),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_orders_occ
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_lab_results_occ
  BEFORE UPDATE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_orders_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

CREATE TRIGGER trg_lab_results_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

-- Check Order Cancellation: only allowed if status is 'ordered' or 'scheduled'
CREATE OR REPLACE FUNCTION public.check_order_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status NOT IN ('ordered', 'scheduled') THEN
    RAISE EXCEPTION 'Cannot cancel order: procedure has already started or completed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_order_cancellation
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_order_cancellation();

-- Auto-transition Visit to 'doctor_review' when ALL active orders for this visit reach 'completed' or 'cancelled'
CREATE OR REPLACE FUNCTION public.check_and_trigger_doctor_review()
RETURNS TRIGGER AS $$
DECLARE
  v_pending_count INTEGER;
BEGIN
  -- Count orders that are not finished yet
  SELECT count(*)
  INTO v_pending_count
  FROM public.orders
  WHERE visit_id = NEW.visit_id
    AND status NOT IN ('completed', 'cancelled');

  -- If all orders are completed, update visit status to 'doctor_review'
  IF v_pending_count = 0 THEN
    UPDATE public.visits
    SET status = 'doctor_review'
    WHERE id = NEW.visit_id
      AND status IN ('pending_orders', 'in_doctor');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_doctor_loopback
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_and_trigger_doctor_review();

-- RLS: med_tech can only view and update lab orders
CREATE POLICY "Med tech can view only lab orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'active_role') = 'med_tech' AND order_type = 'lab'
    OR (auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'nurse', 'cashier', 'director', 'admin')
  );

CREATE POLICY "Med tech can update lab orders status"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'active_role') = 'med_tech' AND order_type = 'lab'
    OR (auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'admin')
  );

CREATE POLICY "Med tech can manage lab results"
  ON public.lab_results FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('med_tech', 'admin'));

CREATE POLICY "Clinical staff can view lab results"
  ON public.lab_results FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'nurse', 'director', 'admin'));
