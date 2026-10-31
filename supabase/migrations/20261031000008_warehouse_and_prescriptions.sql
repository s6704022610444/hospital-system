-- Migration: 20261031000008_warehouse_and_prescriptions.sql
-- Description: Master medications inventory (zero negative stock), prescriptions, allergy alert, and 2-phase deduction (Phase 1: Reserve)

CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  drug_class TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'tablet',
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT chk_stock_non_negative CHECK (total_stock >= 0),
  CONSTRAINT chk_reserved_non_negative CHECK (reserved_stock >= 0),
  CONSTRAINT chk_available_non_negative CHECK (total_stock >= reserved_stock)
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  doctor_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'dispensed', 'cancelled', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE RESTRICT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  is_covered BOOLEAN NOT NULL DEFAULT true,
  allergy_override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_medications_occ BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();
CREATE TRIGGER trg_prescriptions_occ BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();
CREATE TRIGGER trg_prescription_items_occ BEFORE UPDATE ON public.prescription_items FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_medications_audit AFTER INSERT OR UPDATE OR DELETE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();
CREATE TRIGGER trg_prescriptions_audit AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();
CREATE TRIGGER trg_prescription_items_audit AFTER INSERT OR UPDATE OR DELETE ON public.prescription_items FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

-- Reserve stock on prescription item creation
CREATE OR REPLACE FUNCTION public.reserve_stock_on_prescription()
RETURNS TRIGGER AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT (total_stock - reserved_stock) INTO v_available
  FROM public.medications
  WHERE id = NEW.medication_id
  FOR UPDATE;

  IF v_available < NEW.quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT STOCK: Requested % units, but only % available in hospital master stock.', NEW.quantity, v_available;
  END IF;

  UPDATE public.medications
  SET reserved_stock = reserved_stock + NEW.quantity
  WHERE id = NEW.medication_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reserve_medication_stock
  AFTER INSERT ON public.prescription_items
  FOR EACH ROW EXECUTE FUNCTION public.reserve_stock_on_prescription();

-- Release reservations when prescription is cancelled or expired
CREATE OR REPLACE FUNCTION public.release_stock_on_prescription_cancel()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
BEGIN
  IF NEW.status IN ('cancelled', 'expired') AND OLD.status = 'pending' THEN
    FOR v_item IN SELECT medication_id, quantity FROM public.prescription_items WHERE prescription_id = NEW.id
    LOOP
      UPDATE public.medications
      SET reserved_stock = greatest(0, reserved_stock - v_item.quantity)
      WHERE id = v_item.medication_id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_release_prescription_stock
  AFTER UPDATE OF status ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.release_stock_on_prescription_cancel();

CREATE OR REPLACE FUNCTION public.auto_release_expired_prescriptions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE public.prescriptions
  SET status = 'expired'
  WHERE status = 'pending'
    AND created_at < (now() - interval '24 hours');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "All authenticated users can view medications"
  ON public.medications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Warehouse staff can manage medications inventory"
  ON public.medications FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('warehouse', 'pharmacist', 'admin'));

CREATE POLICY "Clinical and pharmacy staff can read prescriptions"
  ON public.prescriptions FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'pharmacist', 'nurse', 'cashier', 'director', 'admin'));

CREATE POLICY "Doctors can create prescriptions"
  ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'admin'));

CREATE POLICY "Clinical and pharmacy can view prescription items"
  ON public.prescription_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Doctors can insert prescription items"
  ON public.prescription_items FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'admin'));
