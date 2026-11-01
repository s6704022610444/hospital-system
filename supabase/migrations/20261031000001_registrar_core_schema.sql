-- Migration: 20261031000001_registrar_core_schema.sql
-- Description: Core Registrar tables, multi-type ID, appointments, visits with daily midnight VN reset, and amendments audit

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Custom Types for Registrar
DO $$ BEGIN
  CREATE TYPE identification_type AS ENUM ('thai_cid', 'passport', 'anonymous_trauma');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE patient_record_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE visit_inflow_type AS ENUM ('walk_in', 'appointment', 'referral');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE referral_document_status AS ENUM ('none', 'pending_document', 'verified', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE opd_visit_status AS ENUM (
    'registered',       -- เวชระเบียนลงทะเบียน/เปิด Visit
    'triaged',          -- คัดกรองเสร็จ รอพบแพทย์
    'in_doctor',        -- กำลังตรวจในห้องแพทย์
    'pending_orders',   -- ส่งตรวจแล็บ / X-ray / นิวเคลียร์
    'doctor_review',    -- ผลตรวจครบ วนกลับมารอพบแพทย์
    'pending_payment',  -- รอชำระเงินที่การเงิน
    'dispensing',       -- รอรับยาที่ห้องยา
    'completed',        -- สิ้นสุดการรับบริการ
    'unpaid_debt',      -- หนีกลับ / ค้างชำระ (Walkout)
    'cancelled'         -- ยกเลิกการรับบริการ
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Sequence Generator Table for Daily Midnight VN Reset (ADR 0003)
CREATE TABLE IF NOT EXISTS public.daily_vn_sequences (
  date_key TEXT PRIMARY KEY, -- Formatted as 'DDMMYYYY' (Buddhist Era) e.g. '31102568'
  current_val INTEGER NOT NULL DEFAULT 0
);

-- Function to generate next VN atomically with daily reset
CREATE OR REPLACE FUNCTION public.generate_next_daily_vn(p_date_key TEXT)
RETURNS TEXT AS $$
DECLARE
  v_next_val INTEGER;
BEGIN
  INSERT INTO public.daily_vn_sequences (date_key, current_val)
  VALUES (p_date_key, 1)
  ON CONFLICT (date_key) DO UPDATE
  SET current_val = public.daily_vn_sequences.current_val + 1
  RETURNING current_val INTO v_next_val;

  -- Stored format: VN-DDMMYYYY-XXXXXXX (ADR 0003)
  RETURN 'VN-' || p_date_key || '-' || lpad(v_next_val::text, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Sequence for HN: HN-YY-XXXXXXX
CREATE SEQUENCE IF NOT EXISTS public.seq_hn_68 START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_next_hn(p_year_2digit TEXT DEFAULT '68')
RETURNS TEXT AS $$
DECLARE
  v_next_val BIGINT;
BEGIN
  v_next_val := nextval('public.seq_hn_68');
  -- Stored format: HN-YY-XXXXXXX (ADR 0003)
  RETURN 'HN-' || p_year_2digit || '-' || lpad(v_next_val::text, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Table: patients (ADR 0001, ADR 0002, ADR 0003, ADR 0005)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hn TEXT UNIQUE NOT NULL, -- Stored: HN-YY-XXXXXXX
  id_type identification_type NOT NULL DEFAULT 'thai_cid',
  national_id TEXT UNIQUE, -- 13 digits for Thai CID
  passport_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F', 'Other')),
  birth_date DATE NOT NULL,
  blood_group TEXT DEFAULT 'O',
  insurance_scheme TEXT NOT NULL DEFAULT 'Self-pay',
  affiliated_hospital TEXT, -- สถานพยาบาลตามสิทธิ เช่น รพช.ธัญบุรี (ADR 0002)
  phone TEXT,
  address TEXT,
  outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status patient_record_status NOT NULL DEFAULT 'active', -- ADR 0005
  merged_into_hn TEXT, -- If inactive, references primary HN (ADR 0005)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table: appointments (ใบนัดตรวจล่วงหน้า และคิวส่งตัวจากระบบ THE 1 / รพ.อื่น)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number TEXT UNIQUE NOT NULL, -- e.g. 'APT-25681021-001'
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  clinic_name TEXT NOT NULL, -- e.g. 'เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์)'
  doctor_name TEXT NOT NULL, -- e.g. 'นพ. ทวี ยิ่งสง่า'
  appointment_date DATE NOT NULL,
  appointment_time_slot TEXT NOT NULL, -- e.g. '08:00 - 10:00 น.'
  preparation_instructions TEXT, -- e.g. 'เจาะเลือด + U/S CA1634'
  referring_hospital TEXT, -- e.g. 'รพช.ธัญบุรี', 'รพ.ชัยภูมิ'
  referral_doc_no TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'cancelled', 'completed')),
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table: visits (ADR 0001, ADR 0002, ADR 0003)
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vn TEXT UNIQUE NOT NULL, -- Stored: VN-DDMMYYYY-XXXXXXX
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  queue_number TEXT NOT NULL, -- Display Queue: e.g. 'A-01', 'A-24'
  inflow_type visit_inflow_type NOT NULL DEFAULT 'walk_in', -- ADR 0001
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  clinic_name TEXT NOT NULL,
  room_number TEXT,
  doctor_name TEXT,
  status opd_visit_status NOT NULL DEFAULT 'registered',
  chief_complaint TEXT NOT NULL,
  triage_level TEXT NOT NULL DEFAULT 'routine',

  -- Referral Tracking (ADR 0001 & ADR 0002)
  is_referral BOOLEAN NOT NULL DEFAULT false,
  referring_hospital TEXT,
  referral_doc_no TEXT,
  referral_doc_status referral_document_status NOT NULL DEFAULT 'none',

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Table: patient_amendments (ประวัติการแก้ไขข้อมูลสำคัญทางกฎหมาย - ADR 0005)
CREATE TABLE IF NOT EXISTS public.patient_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  amendment_reason TEXT NOT NULL, -- Mandatory justification (ADR 0005)
  amended_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_amendments ENABLE ROW LEVEL SECURITY;

-- 8. Basic Policies
CREATE POLICY "Public staff can read visits" ON public.visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public staff can read patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public staff can read appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
