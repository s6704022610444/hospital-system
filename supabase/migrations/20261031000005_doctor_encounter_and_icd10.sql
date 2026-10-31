-- Migration: 20261031000005_doctor_encounter_and_icd10.sql
-- Description: Medical records (SOAP notes), ICD-10 diagnoses, and doctor queue management

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
  diagnosis_type TEXT NOT NULL DEFAULT 'primary' CHECK (diagnosis_type IN ('primary', 'secondary', 'complication', 'comorbidity')),
  doctor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_medical_records_occ
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_diagnoses_occ
  BEFORE UPDATE ON public.diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_medical_records_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

CREATE TRIGGER trg_diagnoses_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

-- Doctor calls patient into examination room: sets visits.status to 'in_doctor'
CREATE OR REPLACE FUNCTION public.call_patient_to_doctor(p_visit_id UUID)
RETURNS jsonb AS $$
BEGIN
  UPDATE public.visits
  SET status = 'in_doctor'
  WHERE id = p_visit_id
    AND status IN ('triaged', 'doctor_review');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot call patient: visit not in triaged or doctor_review status';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'visit_id', p_visit_id,
    'status', 'in_doctor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save encounter notes and ICD-10 diagnoses
CREATE OR REPLACE FUNCTION public.save_clinical_encounter(
  p_visit_id UUID,
  p_hn TEXT,
  p_subjective TEXT,
  p_objective TEXT,
  p_assessment TEXT,
  p_plan TEXT,
  p_physical_exam TEXT DEFAULT NULL,
  p_diagnoses JSONB DEFAULT '[]'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_diag JSONB;
BEGIN
  INSERT INTO public.medical_records (
    visit_id, hn, subjective, objective, assessment, plan, physical_exam, doctor_id
  ) VALUES (
    p_visit_id, p_hn, p_subjective, p_objective, p_assessment, p_plan, p_physical_exam, auth.uid()
  );

  FOR v_diag IN SELECT * FROM jsonb_array_elements(p_diagnoses)
  LOOP
    INSERT INTO public.diagnoses (
      visit_id, hn, icd10_code, icd10_description, diagnosis_type, doctor_id
    ) VALUES (
      p_visit_id,
      p_hn,
      v_diag->>'icd10_code',
      v_diag->>'icd10_description',
      coalesce(v_diag->>'diagnosis_type', 'primary'),
      auth.uid()
    );
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
CREATE POLICY "Clinical staff can view medical records"
  ON public.medical_records FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'director', 'admin'));

CREATE POLICY "Doctors can insert medical records"
  ON public.medical_records FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'admin'));

CREATE POLICY "Clinical staff can view diagnoses"
  ON public.diagnoses FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'nurse', 'pharmacist', 'cashier', 'director', 'admin'));

CREATE POLICY "Doctors can insert diagnoses"
  ON public.diagnoses FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('doctor', 'admin'));
