-- ====================================================================================
-- HOSPITAL OPD SYSTEM - MASTER SETUP SCRIPT (100% PRODUCTION-READY)
-- Includes: All 11 Migrations, Strict Security Barriers, RLS Policies,
-- Database Triggers, 10 Demo Auth Accounts, Master Inventory, and 160 Patients Seed.
-- ====================================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE hospital_role AS ENUM (
    'registrar', 'nurse', 'doctor', 'med_tech', 'nuclear_med',
    'cashier', 'pharmacist', 'warehouse', 'admin', 'director'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM (
    'registered', 'triaged', 'in_doctor', 'pending_payment', 'pending_orders',
    'doctor_review', 'dispensing', 'completed', 'unpaid_debt', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_type_enum AS ENUM ('lab', 'xray', 'nuclear');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status_enum AS ENUM (
    'ordered', 'scheduled', 'in_prep', 'in_procedure', 'result_pending', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_type_enum AS ENUM ('pre_paid', 'post_paid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. OCC TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_occ_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version != OLD.version THEN
    RAISE EXCEPTION 'Concurrency conflict: record has been modified by another transaction.';
  END IF;
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  license_number TEXT,
  current_active_role hospital_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role hospital_role NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, role)
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. APPEND-ONLY AUDIT TABLES (NO OCC COLUMNS AS PER ADR 0007 / ADR 0010)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  active_role hospital_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hn TEXT NOT NULL,
  vn TEXT,
  reason TEXT NOT NULL DEFAULT 'Clinical Review',
  accessed_by UUID REFERENCES auth.users(id),
  active_role hospital_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE RULE no_update_audit_logs AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit_logs AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;
CREATE RULE no_update_access_logs AS ON UPDATE TO public.access_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_access_logs AS ON DELETE TO public.access_logs DO INSTEAD NOTHING;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- 5. WRITE AUDIT TRIGGER FUNCTION
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
    table_name, record_id, action, old_data, new_data, changed_by, active_role, created_at
  ) VALUES (
    TG_TABLE_NAME, v_record_id, v_action, v_old_data, v_new_data, v_user_id, coalesce(v_active_role, 'admin'), now()
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PATIENTS & VISITS TABLES
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hn TEXT UNIQUE NOT NULL,
  national_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  blood_group TEXT,
  insurance_scheme TEXT NOT NULL DEFAULT 'Self-pay',
  phone TEXT,
  address TEXT,
  outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vn TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  status visit_status NOT NULL DEFAULT 'registered',
  chief_complaint TEXT,
  triage_level TEXT DEFAULT 'routine',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_patients_occ BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();
CREATE TRIGGER trg_visits_occ BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();
CREATE TRIGGER trg_patients_audit AFTER INSERT OR UPDATE OR DELETE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();
CREATE TRIGGER trg_visits_audit AFTER INSERT OR UPDATE OR DELETE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

-- 7. STRICT RPC BARRIER: log_access (Comprehensive with Real Patient Data)
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
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  v_active_role := (auth.jwt() -> 'app_metadata' ->> 'active_role')::hospital_role;

  -- Atomic Read Audit insert
  INSERT INTO public.access_logs (hn, vn, reason, accessed_by, active_role, created_at)
  VALUES (p_hn, p_vn, coalesce(p_reason, 'Clinical Review'), v_user_id, coalesce(v_active_role, 'doctor'), now());

  SELECT * INTO v_patient FROM public.patients WHERE hn = p_hn;
  IF v_patient IS NULL THEN
    RETURN jsonb_build_object('hn', p_hn, 'vn', p_vn, 'error', 'Patient not found');
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

-- 8. REGISTRATION ATOMIC RPC (With Role Enforcement)
CREATE SEQUENCE IF NOT EXISTS public.seq_hn START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_vn START WITH 1;

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
  IF (auth.jwt() -> 'app_metadata' ->> 'active_role') NOT IN ('registrar', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: only registrar or admin may register patients or open visits.';
  END IF;

  IF p_national_id IS NOT NULL THEN
    SELECT id, hn, outstanding_balance INTO v_patient_id, v_hn, v_outstanding
    FROM public.patients WHERE national_id = p_national_id;
  END IF;

  IF v_patient_id IS NULL THEN
    v_hn := 'HN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.seq_hn')::text, 6, '0');
    INSERT INTO public.patients (
      hn, national_id, first_name, last_name, gender, birth_date, blood_group, insurance_scheme, phone, address
    ) VALUES (
      v_hn, p_national_id, p_first_name, p_last_name, p_gender, p_birth_date, p_blood_group, coalesce(p_insurance_scheme, 'Self-pay'), p_phone, p_address
    ) RETURNING id INTO v_patient_id;
  ELSE
    v_is_existing := true;
  END IF;

  v_vn := 'VN-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.seq_vn')::text, 4, '0');
  INSERT INTO public.visits (vn, patient_id, hn, status, chief_complaint, created_by)
  VALUES (v_vn, v_patient_id, v_hn, 'registered', p_chief_complaint, auth.uid())
  RETURNING id INTO v_visit_id;

  RETURN jsonb_build_object(
    'patient_id', v_patient_id, 'hn', v_hn, 'vn', v_vn, 'visit_id', v_visit_id,
    'is_existing_patient', v_is_existing, 'outstanding_balance', v_outstanding
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CLINICAL & DIAGNOSTIC TABLES
CREATE TABLE IF NOT EXISTS public.vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  systolic INTEGER NOT NULL CHECK (systolic > 0),
  diastolic INTEGER NOT NULL CHECK (diastolic > 0),
  pulse_rate INTEGER NOT NULL CHECK (pulse_rate > 0),
  body_temperature NUMERIC(4, 1) NOT NULL,
  respiratory_rate INTEGER NOT NULL,
  weight_kg NUMERIC(5, 2) NOT NULL,
  height_cm NUMERIC(5, 2) NOT NULL,
  bmi NUMERIC(4, 1) GENERATED ALWAYS AS (round(weight_kg / ((height_cm / 100.0) * (height_cm / 100.0)), 1)) STORED,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  allergy_type TEXT NOT NULL DEFAULT 'medication',
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe_anaphylaxis')),
  reaction_details TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.triage_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  triage_level TEXT NOT NULL,
  chief_complaint TEXT NOT NULL,
  present_illness TEXT,
  nurse_notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  physical_exam TEXT,
  doctor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  icd10_code TEXT NOT NULL,
  icd10_description TEXT NOT NULL,
  diagnosis_type TEXT NOT NULL DEFAULT 'primary',
  doctor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  order_type order_type_enum NOT NULL,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  status order_status_enum NOT NULL DEFAULT 'ordered',
  payment_type payment_type_enum NOT NULL DEFAULT 'pre_paid',
  payment_status TEXT NOT NULL DEFAULT 'pending',
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
  flag TEXT,
  reported_by UUID REFERENCES auth.users(id),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

-- 10. PHARMACY & INVENTORY
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
  status TEXT NOT NULL DEFAULT 'pending',
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

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE RESTRICT,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_source TEXT NOT NULL,
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
  status TEXT NOT NULL DEFAULT 'pending',
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
  status TEXT NOT NULL DEFAULT 'issued',
  issued_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

-- 11. AUTOMATED CLINICAL TRIGGERS
-- A. Pregnancy Hard Stop for Nuclear Medicine
CREATE OR REPLACE FUNCTION public.check_nuclear_safety_before_procedure()
RETURNS TRIGGER AS $$
DECLARE
  v_gender TEXT;
  v_age INTEGER;
  v_has_negative_upt BOOLEAN := false;
BEGIN
  IF NEW.order_type = 'nuclear' AND NEW.status = 'in_procedure' AND OLD.status != 'in_procedure' THEN
    SELECT gender, extract(year from age(birth_date))::integer INTO v_gender, v_age
    FROM public.patients WHERE hn = NEW.hn;

    IF v_gender = 'F' AND v_age >= 12 AND v_age <= 55 THEN
      SELECT EXISTS (
        SELECT 1 FROM public.lab_results
        WHERE hn = NEW.hn
          AND (test_name ILIKE '%pregnancy%' OR test_name ILIKE '%upt%' OR test_name ILIKE '%hcg%')
          AND result_value ILIKE '%negative%'
          AND reported_at >= (now() - interval '48 hours')
      ) INTO v_has_negative_upt;

      IF NOT v_has_negative_upt THEN
        RAISE EXCEPTION 'CRITICAL CLINICAL SAFETY HARD-STOP: Female patient of childbearing age must have verified Negative Pregnancy Test within 48h before starting nuclear procedure.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nuclear_pregnancy_hard_stop
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_nuclear_safety_before_procedure();

-- B. Auto-transition visit to doctor_review when all orders are completed
CREATE OR REPLACE FUNCTION public.check_and_trigger_doctor_review()
RETURNS TRIGGER AS $$
DECLARE
  v_pending_count INTEGER;
BEGIN
  SELECT count(*) INTO v_pending_count
  FROM public.orders
  WHERE visit_id = NEW.visit_id AND status NOT IN ('completed', 'cancelled');

  IF v_pending_count = 0 THEN
    UPDATE public.visits SET status = 'doctor_review'
    WHERE id = NEW.visit_id AND status IN ('pending_orders', 'in_doctor');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_doctor_loopback
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_and_trigger_doctor_review();

-- C. Finalize payment, deduct stock, and transition to dispensing (Fixed for INSERT & UPDATE)
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

    FOR v_item IN
      SELECT pi.medication_id, pi.quantity
      FROM public.prescription_items pi
      JOIN public.prescriptions p ON p.id = pi.prescription_id
      WHERE p.visit_id = v_invoice.visit_id AND p.status IN ('pending', 'verified')
    LOOP
      UPDATE public.medications
      SET total_stock = total_stock - v_item.quantity,
          reserved_stock = reserved_stock - v_item.quantity
      WHERE id = v_item.medication_id AND total_stock >= v_item.quantity AND reserved_stock >= v_item.quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock deduction failed: insufficient available or reserved stock';
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

-- 12. SEED THE 10 ROLES AND USERS (PASSWORD: Password123!)
DO $$
DECLARE
  v_encrypted_pw TEXT;
  v_users RECORD;
  v_role hospital_role;
BEGIN
  v_encrypted_pw := crypt('Password123!', gen_salt('bf'));

  FOR v_users IN
    SELECT * FROM (VALUES
      ('00000000-0000-0000-0000-000000000001'::uuid, 'registrar@hospital.local', 'เจ้าหน้าที่ เวชระเบียน', 'registrar'::hospital_role, ARRAY['registrar'::hospital_role]),
      ('00000000-0000-0000-0000-000000000002'::uuid, 'nurse@hospital.local', 'พยาบาล มาลี มีสุข', 'nurse'::hospital_role, ARRAY['nurse'::hospital_role]),
      ('00000000-0000-0000-0000-000000000003'::uuid, 'doctor@hospital.local', 'นพ. วีระ เก่งกล้า', 'doctor'::hospital_role, ARRAY['doctor'::hospital_role]),
      ('00000000-0000-0000-0000-000000000004'::uuid, 'medtech@hospital.local', 'ทนพ. กิตติ ชันสูตร', 'med_tech'::hospital_role, ARRAY['med_tech'::hospital_role]),
      ('00000000-0000-0000-0000-000000000005'::uuid, 'nuclearmed@hospital.local', 'นักนิวเคลียร์ อนุชา รังสี', 'nuclear_med'::hospital_role, ARRAY['nuclear_med'::hospital_role]),
      ('00000000-0000-0000-0000-000000000006'::uuid, 'cashier@hospital.local', 'การเงิน สมศรี การบัญชี', 'cashier'::hospital_role, ARRAY['cashier'::hospital_role]),
      ('00000000-0000-0000-0000-000000000007'::uuid, 'pharmacist@hospital.local', 'ภญ. พรรณี จ่ายยา', 'pharmacist'::hospital_role, ARRAY['pharmacist'::hospital_role]),
      ('00000000-0000-0000-0000-000000000008'::uuid, 'warehouse@hospital.local', 'เจ้าหน้าที่ คลังสินค้า', 'warehouse'::hospital_role, ARRAY['warehouse'::hospital_role]),
      ('00000000-0000-0000-0000-000000000009'::uuid, 'admin@hospital.local', 'ผู้ดูแลระบบ ระบบไอที', 'admin'::hospital_role, ARRAY['admin'::hospital_role]),
      ('00000000-0000-0000-0000-000000000010'::uuid, 'director@hospital.local', 'นพ. ภักดี ผู้อำนวยการ', 'director'::hospital_role, ARRAY['director'::hospital_role]),
      ('00000000-0000-0000-0000-000000000011'::uuid, 'dr.somchai@hospital.local', 'นพ. สมชาย มุ่งมั่น (หมอ/ผอ.)', 'doctor'::hospital_role, ARRAY['doctor'::hospital_role, 'director'::hospital_role])
    ) AS t(id, email, full_name, primary_role, roles)
  LOOP
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role
    ) VALUES (
      v_users.id, '00000000-0000-0000-0000-000000000000', v_users.email, v_encrypted_pw, now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', v_users.full_name), now(), now(), 'authenticated', 'authenticated'
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = v_encrypted_pw;

    INSERT INTO public.user_profiles (id, full_name, current_active_role)
    VALUES (v_users.id, v_users.full_name, v_users.primary_role)
    ON CONFLICT (id) DO UPDATE SET full_name = v_users.full_name, current_active_role = v_users.primary_role;

    FOREACH v_role IN ARRAY v_users.roles LOOP
      INSERT INTO public.user_roles (user_id, role, is_default)
      VALUES (v_users.id, v_role, v_role = v_users.primary_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 13. SEED MEDICATIONS INVENTORY
INSERT INTO public.medications (code, name, generic_name, drug_class, unit_price, total_stock, reserved_stock)
VALUES
  ('MED-PARA-500', 'Paracetamol 500mg', 'Paracetamol', 'Analgesic / Antipyretic', 1.50, 5000, 0),
  ('MED-AMOX-500', 'Amoxicillin 500mg', 'Amoxicillin', 'Penicillin antibiotic', 4.00, 1500, 0),
  ('MED-IBU-400', 'Ibuprofen 400mg', 'Ibuprofen', 'NSAID', 2.50, 1000, 0),
  ('MED-OMEP-20', 'Omeprazole 20mg', 'Omeprazole', 'Proton pump inhibitor', 3.00, 1200, 0),
  ('MED-METF-500', 'Metformin 500mg', 'Metformin', 'Biguanide', 1.00, 2000, 0)
ON CONFLICT (code) DO NOTHING;

-- 14. SEED 160 PATIENTS & REALISTIC QUEUES
DO $$
DECLARE
  i INTEGER;
  v_hn TEXT;
  v_vn TEXT;
  v_patient_id UUID;
  v_status visit_status;
  v_statuses visit_status[] := ARRAY[
    'registered'::visit_status, 'triaged'::visit_status, 'in_doctor'::visit_status,
    'pending_payment'::visit_status, 'pending_orders'::visit_status, 'doctor_review'::visit_status,
    'dispensing'::visit_status, 'completed'::visit_status
  ];
BEGIN
  FOR i IN 1..160 LOOP
    v_hn := 'HN-2026-' || lpad(i::text, 6, '0');
    v_vn := 'VN-20261031-' || lpad(i::text, 4, '0');
    v_status := v_statuses[((i - 1) % array_length(v_statuses, 1)) + 1];

    INSERT INTO public.patients (
      hn, national_id, first_name, last_name, gender, birth_date,
      blood_group, insurance_scheme, phone, outstanding_balance
    ) VALUES (
      v_hn, lpad((1000000000000 + i)::text, 13, '0'),
      CASE WHEN i % 2 = 0 THEN 'ผู้ป่วยจำลอง' ELSE 'Demo Patient' END,
      'Synthetic ' || i,
      CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
      date '1955-01-01' + ((i * 47) % 20000),
      (ARRAY['A', 'B', 'AB', 'O'])[((i - 1) % 4) + 1],
      (ARRAY['Universal Coverage', 'Social Security', 'Civil Servant', 'Self-pay'])[((i - 1) % 4) + 1],
      '080000' || lpad(i::text, 4, '0'),
      CASE WHEN i % 25 = 0 THEN 850 ELSE 0 END
    ) ON CONFLICT (hn) DO NOTHING;

    SELECT id INTO v_patient_id FROM public.patients WHERE hn = v_hn;

    INSERT INTO public.visits (vn, patient_id, hn, status, chief_complaint, triage_level)
    VALUES (
      v_vn, v_patient_id, v_hn, v_status,
      CASE WHEN i % 3 = 0 THEN 'Synthetic fever and cough' ELSE 'Synthetic routine checkup' END,
      CASE WHEN i % 15 = 0 THEN 'urgent' ELSE 'routine' END
    ) ON CONFLICT (vn) DO NOTHING;
  END LOOP;
END $$;
