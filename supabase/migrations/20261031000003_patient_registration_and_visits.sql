-- Migration: 20261031000003_patient_registration_and_visits.sql
-- Description: Patients Registry, Visits (Macro State Machine), and Unique CID Constraint

-- 1. Enum: visit_status (Macro State as per ADR 0001 & ADR 0009)
CREATE TYPE visit_status AS ENUM (
  'registered',       -- เวชระเบียนลงทะเบียน/เปิด Visit
  'triaged',          -- พยาบาลคัดกรอง/วัดสัญญาณชีพเสร็จ รอพบหมอ
  'in_doctor',        -- กำลังตรวจในห้องตรวจแพทย์
  'pending_payment',  -- รอชำระเงินที่การเงิน (Pre-paid หรือค่าตรวจรักษา/ค่ายา)
  'pending_orders',   -- รอตรวจตามแผนกแล็บ, เอกซเรย์, นิวเคลียร์
  'doctor_review',    -- ผลตรวจครบ วนกลับมารอพบแพทย์เพื่อฟังผล
  'dispensing',       -- รอรับยาที่ห้องยา
  'completed',        -- สิ้นสุดกระบวนการรับบริการ
  'unpaid_debt',      -- คนไข้หนีกลับ/ค้างชำระ (Walkout)
  'cancelled'         -- ยกเลิกการรับบริการ
);

-- 2. Table: patients
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hn TEXT UNIQUE NOT NULL, -- เช่น HN-2026-000001
  national_id TEXT UNIQUE, -- เลขบัตรประชาชน 13 หลัก (ป้องกัน HN ซ้ำซ้อนตาม ADR 0012)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL, -- 'M', 'F', 'Other'
  birth_date DATE NOT NULL,
  blood_group TEXT, -- 'A', 'B', 'AB', 'O'
  insurance_scheme TEXT NOT NULL DEFAULT 'Self-pay', -- 'Universal Coverage', 'Social Security', 'Civil Servant', 'Self-pay'
  phone TEXT,
  address TEXT,
  outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- หนี้ค้างชำระตาม ADR 0009
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1 -- OCC Column as per ADR 0010
);

-- 3. Table: visits (Macro State Tracking)
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vn TEXT UNIQUE NOT NULL, -- เช่น VN-20261031-0001
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  status visit_status NOT NULL DEFAULT 'registered',
  chief_complaint TEXT,
  triage_level TEXT DEFAULT 'routine', -- 'resuscitation', 'emergency', 'urgent', 'semi_urgent', 'routine'
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'exempted'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1 -- OCC Column as per ADR 0010
);

-- 4. Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 5. OCC Triggers
CREATE TRIGGER trg_patients_occ
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_visits_occ
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

-- 6. Write Audit Triggers (Capture INSERT/UPDATE/DELETE events automatically)
CREATE TRIGGER trg_patients_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

CREATE TRIGGER trg_visits_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

-- 7. Sequence Generator Functions for HN and VN
CREATE SEQUENCE IF NOT EXISTS public.seq_hn START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_vn START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_next_hn()
RETURNS TEXT AS $$
BEGIN
  RETURN 'HN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.seq_hn')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_next_vn()
RETURNS TEXT AS $$
BEGIN
  RETURN 'VN-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.seq_vn')::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 8. Atomic Registration / Visit Creation Function
-- Automatically prevents duplicate HN when national_id exists
CREATE OR REPLACE FUNCTION public.register_or_open_visit(
  p_national_id TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_gender TEXT,
  p_birth_date DATE,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_blood_group TEXT DEFAULT NULL,
  p_insurance_scheme TEXT DEFAULT 'Self-pay',
  p_chief_complaint TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_patient_id UUID;
  v_hn TEXT;
  v_vn TEXT;
  v_visit_id UUID;
  v_outstanding NUMERIC(10, 2) := 0.00;
  v_is_existing BOOLEAN := false;
BEGIN
  -- Security check: Only registrar or admin may register patients or open visits
  IF (auth.jwt() -> 'app_metadata' ->> 'active_role') NOT IN ('registrar', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: only registrar or admin may register patients or open visits.';
  END IF;

  -- 1. Check if patient already exists by national_id
  IF p_national_id IS NOT NULL THEN
    SELECT id, hn, outstanding_balance
    INTO v_patient_id, v_hn, v_outstanding
    FROM public.patients
    WHERE national_id = p_national_id;
  END IF;

  -- 2. If not found, create new patient
  IF v_patient_id IS NULL THEN
    v_hn := public.generate_next_hn();
    INSERT INTO public.patients (
      hn,
      national_id,
      first_name,
      last_name,
      gender,
      birth_date,
      blood_group,
      insurance_scheme,
      phone,
      address
    ) VALUES (
      v_hn,
      p_national_id,
      p_first_name,
      p_last_name,
      p_gender,
      p_birth_date,
      p_blood_group,
      coalesce(p_insurance_scheme, 'Self-pay'),
      p_phone,
      p_address
    ) RETURNING id INTO v_patient_id;
  ELSE
    v_is_existing := true;
  END IF;

  -- 3. Open new Visit (VN)
  v_vn := public.generate_next_vn();
  INSERT INTO public.visits (
    vn,
    patient_id,
    hn,
    status,
    chief_complaint,
    created_by
  ) VALUES (
    v_vn,
    v_patient_id,
    v_hn,
    'registered',
    p_chief_complaint,
    auth.uid()
  ) RETURNING id INTO v_visit_id;

  RETURN jsonb_build_object(
    'patient_id', v_patient_id,
    'hn', v_hn,
    'vn', v_vn,
    'visit_id', v_visit_id,
    'is_existing_patient', v_is_existing,
    'outstanding_balance', v_outstanding
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RLS Policies
-- visits: Queue visibility for all authenticated staff
CREATE POLICY "Staff can view all visits for queue"
  ON public.visits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Registrar and nurses can manage visits"
  ON public.visits FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('registrar', 'nurse', 'doctor', 'cashier', 'admin'));

-- patients: Basic info viewable by registrar, admin, cashier
CREATE POLICY "Registrar and Admin can view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('registrar', 'admin', 'cashier', 'director'));

CREATE POLICY "Registrar can insert/update patients"
  ON public.patients FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('registrar', 'admin'));

-- 10. Comprehensive Single Patient View RPC (log_access)
-- Replaces initial stub: records read audit and returns verified patient profile
CREATE OR REPLACE FUNCTION public.log_access(
  p_hn TEXT,
  p_vn TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'Clinical Review'
)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_active_role hospital_role;
  v_patient RECORD;
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

  -- 2. Fetch Patient Data
  SELECT * INTO v_patient
  FROM public.patients
  WHERE hn = p_hn;

  IF v_patient IS NULL THEN
    RETURN jsonb_build_object(
      'hn', p_hn,
      'vn', p_vn,
      'error', 'Patient not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'hn', v_patient.hn,
    'vn', p_vn,
    'fullName', v_patient.first_name || ' ' || v_patient.last_name,
    'gender', v_patient.gender,
    'age', extract(year from age(v_patient.birth_date))::integer,
    'birthDate', v_patient.birth_date,
    'bloodGroup', v_patient.blood_group,
    'insuranceScheme', v_patient.insurance_scheme,
    'outstandingBalance', v_patient.outstanding_balance,
    'access_timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

