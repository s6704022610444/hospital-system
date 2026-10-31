-- Migration: 20261031000010_walkout_debt_and_refund.sql
-- Description: Outstanding debt tracking, walkout status, and cashier/admin-only void/refund

CREATE OR REPLACE FUNCTION public.mark_visit_unpaid_debt(
  p_visit_id UUID,
  p_outstanding_amount NUMERIC,
  p_reason TEXT DEFAULT 'Patient walkout'
)
RETURNS jsonb AS $$
DECLARE
  v_hn TEXT;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'active_role') NOT IN ('cashier', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: only cashier or admin may mark a visit as unpaid debt.';
  END IF;

  SELECT hn INTO v_hn FROM public.visits WHERE id = p_visit_id;
  IF v_hn IS NULL THEN RAISE EXCEPTION 'Visit not found'; END IF;

  UPDATE public.visits SET status = 'unpaid_debt' WHERE id = p_visit_id;
  UPDATE public.patients
  SET outstanding_balance = outstanding_balance + p_outstanding_amount
  WHERE hn = v_hn;

  INSERT INTO public.audit_logs(table_name, record_id, action, new_data, changed_by, active_role, created_at)
  VALUES ('visits', p_visit_id::text, 'unpaid_debt_marked',
    jsonb_build_object('hn', v_hn, 'amount', p_outstanding_amount, 'reason', p_reason),
    auth.uid(), (auth.jwt() -> 'app_metadata' ->> 'active_role')::hospital_role, now());

  RETURN jsonb_build_object('success', true, 'hn', v_hn, 'outstanding_balance', p_outstanding_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.request_void_or_refund(
  p_receipt_id UUID,
  p_reason TEXT,
  p_refund BOOLEAN DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  v_active_role TEXT;
BEGIN
  v_active_role := auth.jwt() -> 'app_metadata' ->> 'active_role';
  IF v_active_role NOT IN ('cashier', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: only cashier or admin may void/refund receipts.';
  END IF;

  UPDATE public.receipts
  SET status = CASE WHEN p_refund THEN 'refund_pending' ELSE 'voided' END
  WHERE id = p_receipt_id;

  INSERT INTO public.audit_logs(table_name, record_id, action, new_data, changed_by, active_role, created_at)
  VALUES ('receipts', p_receipt_id::text, 'void_refund_requested',
    jsonb_build_object('reason', p_reason, 'refund', p_refund), auth.uid(), v_active_role::hospital_role, now());

  RETURN jsonb_build_object('success', true, 'receipt_id', p_receipt_id, 'status', CASE WHEN p_refund THEN 'refund_pending' ELSE 'voided' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Registrar and triage can view debt alerts"
  ON public.patients FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('registrar', 'nurse', 'admin', 'director'));
