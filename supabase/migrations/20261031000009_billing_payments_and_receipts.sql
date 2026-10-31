-- Migration: 20261031000009_billing_payments_and_receipts.sql
-- Description: Consolidated invoices, receipts, payment processing, and Phase 2 stock deduction

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE RESTRICT,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'voided', 'refund_pending', 'refunded')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_source TEXT NOT NULL CHECK (item_source IN ('order', 'prescription', 'service')),
  source_id UUID,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_covered BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  payment_method TEXT NOT NULL DEFAULT 'qr_mock',
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'voided', 'refunded')),
  transaction_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'voided', 'refund_pending', 'refunded')),
  issued_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_invoices_occ BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();
CREATE TRIGGER trg_invoice_items_occ BEFORE UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();
CREATE TRIGGER trg_payments_occ BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();
CREATE TRIGGER trg_receipts_occ BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_invoices_audit AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();
CREATE TRIGGER trg_payments_audit AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();
CREATE TRIGGER trg_receipts_audit AFTER INSERT OR UPDATE OR DELETE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

CREATE SEQUENCE IF NOT EXISTS public.seq_invoice START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_receipt START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_visit_invoice(p_visit_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_invoice_id UUID;
  v_hn TEXT;
  v_total NUMERIC(12, 2) := 0;
  v_item RECORD;
BEGIN
  SELECT hn INTO v_hn FROM public.visits WHERE id = p_visit_id;
  IF v_hn IS NULL THEN RAISE EXCEPTION 'Visit not found'; END IF;

  INSERT INTO public.invoices (invoice_number, visit_id, hn, created_by)
  VALUES ('INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.seq_invoice')::text, 5, '0'), p_visit_id, v_hn, auth.uid())
  RETURNING id INTO v_invoice_id;

  -- Consolidate completed unpaid post-paid orders
  FOR v_item IN
    SELECT id, item_name AS description, price AS unit_price
    FROM public.orders
    WHERE visit_id = p_visit_id AND payment_type = 'post_paid' AND payment_status = 'pending' AND status = 'completed'
  LOOP
    INSERT INTO public.invoice_items (invoice_id, item_source, source_id, description, unit_price, total_price)
    VALUES (v_invoice_id, 'order', v_item.id, v_item.description, v_item.unit_price, v_item.unit_price);
    v_total := v_total + v_item.unit_price;
  END LOOP;

  -- Consolidate medication prescription items
  FOR v_item IN
    SELECT pi.id, m.name || ' - ' || pi.dosage AS description, pi.total_price, pi.is_covered
    FROM public.prescription_items pi
    JOIN public.prescriptions p ON p.id = pi.prescription_id
    JOIN public.medications m ON m.id = pi.medication_id
    WHERE p.visit_id = p_visit_id AND p.status IN ('pending', 'verified')
  LOOP
    INSERT INTO public.invoice_items (invoice_id, item_source, source_id, description, unit_price, total_price, is_covered)
    VALUES (v_invoice_id, 'prescription', v_item.id, v_item.description, v_item.total_price, v_item.total_price, v_item.is_covered);
    v_total := v_total + v_item.total_price;
  END LOOP;

  UPDATE public.invoices SET subtotal = v_total, total_amount = v_total WHERE id = v_invoice_id;
  RETURN jsonb_build_object('invoice_id', v_invoice_id, 'invoice_number', (SELECT invoice_number FROM public.invoices WHERE id = v_invoice_id), 'total_amount', v_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 2: Deduct reserved stock when invoice is paid and create official receipt
CREATE OR REPLACE FUNCTION public.finalize_payment_and_deduct_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice RECORD;
  v_item RECORD;
  v_receipt_number TEXT;
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status <> 'paid') THEN
    SELECT * INTO v_invoice FROM public.invoices WHERE id = NEW.invoice_id;

    UPDATE public.invoices SET status = 'paid' WHERE id = NEW.invoice_id;
    UPDATE public.visits SET status = 'dispensing', payment_status = 'paid' WHERE id = v_invoice.visit_id AND status = 'pending_payment';

    -- Reduce actual stock and release reservations atomically for paid prescriptions
    FOR v_item IN
      SELECT pi.medication_id, pi.quantity
      FROM public.prescription_items pi
      JOIN public.prescriptions p ON p.id = pi.prescription_id
      WHERE p.visit_id = v_invoice.visit_id AND p.status IN ('pending', 'verified')
    LOOP
      UPDATE public.medications
      SET total_stock = total_stock - v_item.quantity,
          reserved_stock = reserved_stock - v_item.quantity
      WHERE id = v_item.medication_id
        AND total_stock >= v_item.quantity
        AND reserved_stock >= v_item.quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock deduction failed: reservation or total stock mismatch';
      END IF;
    END LOOP;

    UPDATE public.prescriptions SET status = 'verified' WHERE visit_id = v_invoice.visit_id AND status = 'pending';

    v_receipt_number := 'RCP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.seq_receipt')::text, 5, '0');
    INSERT INTO public.receipts (receipt_number, invoice_id, payment_id, amount, issued_by)
    VALUES (v_receipt_number, v_invoice.id, NEW.id, NEW.amount, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_finalize_payment
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.finalize_payment_and_deduct_stock();

CREATE POLICY "Cashier and admin can manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('cashier', 'admin', 'director'));
CREATE POLICY "Cashier and admin can manage payments"
  ON public.payments FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('cashier', 'admin'));
CREATE POLICY "Cashier and admin can manage receipts"
  ON public.receipts FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('cashier', 'admin', 'director'));
CREATE POLICY "Authorized roles can view invoice items"
  ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashier can insert invoice items"
  ON public.invoice_items FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('cashier', 'admin'));
