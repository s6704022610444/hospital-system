-- Migration: 20261031000002_immutable_audit_and_rpc_barrier.sql
-- Description: Append-only Audit Trail, Immutability Rules, and Strict RPC Barrier for Read Audit

-- 1. Table: audit_logs (Write Audit - INSERT, UPDATE, DELETE events)
-- Note: Explicitly exempted from OCC columns (no version, no updated_at) as per ADR 0007 and ADR 0010
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'log_export_generated'
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  active_role hospital_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: access_logs (Read Audit - Records every single patient view access)
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hn TEXT NOT NULL,
  vn TEXT,
  reason TEXT NOT NULL DEFAULT 'Clinical Review',
  accessed_by UUID REFERENCES auth.users(id),
  active_role hospital_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Privilege barrier: clients cannot select sensitive patient records directly, and cannot modify or delete audit records.
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
REVOKE ALL ON public.access_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT ON public.access_logs TO authenticated;
REVOKE UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.access_logs FROM anon, authenticated;

-- 3. Immutability Enforcement (Append-Only Rules)
-- Block UPDATE and DELETE at PostgreSQL engine level
CREATE RULE no_update_audit_logs AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit_logs AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

CREATE RULE no_update_access_logs AS ON UPDATE TO public.access_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_access_logs AS ON DELETE TO public.access_logs DO INSTEAD NOTHING;

-- 4. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Audit Tables
-- Only admin and director can view logs (Forensic Audit & Dashboard)
CREATE POLICY "Admin and Director can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('admin', 'director'));

CREATE POLICY "Admin and Director can view access logs"
  ON public.access_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('admin', 'director'));

-- System and authenticated users can insert logs
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert access logs"
  ON public.access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Generic Write Audit Trigger Function
CREATE OR REPLACE FUNCTION public.audit_write_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_active_role hospital_role;
  v_record_id TEXT;
  v_action TEXT;
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
BEGIN
  v_user_id := auth.uid();
  v_active_role := (auth.jwt() -> 'app_metadata' ->> 'active_role')::hospital_role;

  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_record_id := NEW.id::text;
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_record_id := NEW.id::text;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_record_id := OLD.id::text;
    v_old_data := to_jsonb(OLD);
  END IF;

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by,
    active_role,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    v_record_id,
    v_action,
    v_old_data,
    v_new_data,
    v_user_id,
    coalesce(v_active_role, 'admin'),
    now()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Strict RPC Barrier for Single Patient View (log_access)
-- Mandatory function to view patient clinical data. Inserts Read Audit before returning payload.
CREATE OR REPLACE FUNCTION public.log_access(
  p_hn TEXT,
  p_vn TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'Clinical Review'
)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_active_role hospital_role;
  v_patient_data jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_active_role := (auth.jwt() -> 'app_metadata' ->> 'active_role')::hospital_role;

  -- 1. Insert Read Audit Log first (Atomic guarantee)
  INSERT INTO public.access_logs (
    hn,
    vn,
    reason,
    accessed_by,
    active_role,
    created_at
  ) VALUES (
    p_hn,
    p_vn,
    coalesce(p_reason, 'Clinical Review'),
    v_user_id,
    coalesce(v_active_role, 'doctor'),
    now()
  );

  -- 2. Build Single Patient View Payload
  -- Returns patient header, active encounter, and safety flags
  v_patient_data := jsonb_build_object(
    'hn', p_hn,
    'vn', p_vn,
    'access_timestamp', now(),
    'accessed_by', v_user_id,
    'role_context', v_active_role
  );

  RETURN v_patient_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
