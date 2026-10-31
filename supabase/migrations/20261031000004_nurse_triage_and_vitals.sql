-- Migration: 20261031000004_nurse_triage_and_vitals.sql
-- Description: Vital signs, drug allergies, triage notes, and triaged status transition

CREATE TABLE IF NOT EXISTS public.vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  hn TEXT NOT NULL REFERENCES public.patients(hn) ON DELETE RESTRICT,
  systolic INTEGER NOT NULL CHECK (systolic > 0),
  diastolic INTEGER NOT NULL CHECK (diastolic > 0),
  pulse_rate INTEGER NOT NULL CHECK (pulse_rate > 0),
  body_temperature NUMERIC(4, 1) NOT NULL CHECK (body_temperature > 20.0 AND body_temperature < 50.0),
  respiratory_rate INTEGER NOT NULL CHECK (respiratory_rate > 0),
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0),
  height_cm NUMERIC(5, 2) NOT NULL CHECK (height_cm > 0),
  bmi NUMERIC(4, 1) GENERATED ALWAYS AS (
    round(weight_kg / ((height_cm / 100.0) * (height_cm / 100.0)), 1)
  ) STORED,
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
  triage_level TEXT NOT NULL CHECK (triage_level IN ('resuscitation', 'emergency', 'urgent', 'semi_urgent', 'routine')),
  chief_complaint TEXT NOT NULL,
  present_illness TEXT,
  nurse_notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_notes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_vital_signs_occ
  BEFORE UPDATE ON public.vital_signs
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_allergies_occ
  BEFORE UPDATE ON public.allergies
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_triage_notes_occ
  BEFORE UPDATE ON public.triage_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_vital_signs_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.vital_signs
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

CREATE TRIGGER trg_allergies_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.allergies
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

CREATE TRIGGER trg_triage_notes_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.triage_notes
  FOR EACH ROW EXECUTE FUNCTION public.audit_write_event();

CREATE OR REPLACE FUNCTION public.complete_triage(
  p_visit_id UUID,
  p_hn TEXT,
  p_systolic INTEGER,
  p_diastolic INTEGER,
  p_pulse_rate INTEGER,
  p_body_temperature NUMERIC,
  p_respiratory_rate INTEGER,
  p_weight_kg NUMERIC,
  p_height_cm NUMERIC,
  p_triage_level TEXT,
  p_chief_complaint TEXT,
  p_present_illness TEXT DEFAULT NULL,
  p_nurse_notes TEXT DEFAULT NULL,
  p_allergies JSONB DEFAULT '[]'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_allergy JSONB;
BEGIN
  INSERT INTO public.vital_signs (
    visit_id, hn, systolic, diastolic, pulse_rate,
    body_temperature, respiratory_rate, weight_kg, height_cm, recorded_by
  ) VALUES (
    p_visit_id, p_hn, p_systolic, p_diastolic, p_pulse_rate,
    p_body_temperature, p_respiratory_rate, p_weight_kg, p_height_cm, auth.uid()
  );

  INSERT INTO public.triage_notes (
    visit_id, hn, triage_level, chief_complaint, present_illness, nurse_notes, recorded_by
  ) VALUES (
    p_visit_id, p_hn, p_triage_level, p_chief_complaint, p_present_illness, p_nurse_notes, auth.uid()
  );

  FOR v_allergy IN SELECT * FROM jsonb_array_elements(p_allergies)
  LOOP
    IF coalesce(v_allergy->>'drug_name', '') != '' THEN
      INSERT INTO public.allergies (
        hn, drug_name, severity, reaction_details, recorded_by
      ) VALUES (
        p_hn,
        v_allergy->>'drug_name',
        coalesce(v_allergy->>'severity', 'moderate'),
        v_allergy->>'reaction_details',
        auth.uid()
      );
    END IF;
  END LOOP;

  UPDATE public.visits
  SET status = 'triaged',
      triage_level = p_triage_level,
      chief_complaint = p_chief_complaint
  WHERE id = p_visit_id;

  RETURN jsonb_build_object(
    'success', true,
    'visit_id', p_visit_id,
    'status', 'triaged'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Clinical staff can read triage and vitals"
  ON public.vital_signs FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('nurse', 'doctor', 'med_tech', 'nuclear_med', 'director', 'admin'));

CREATE POLICY "Nurses can insert vitals"
  ON public.vital_signs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('nurse', 'admin'));

CREATE POLICY "Clinical staff can read allergies"
  ON public.allergies FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('nurse', 'doctor', 'pharmacist', 'nuclear_med', 'director', 'admin'));

CREATE POLICY "Nurses and doctors can manage allergies"
  ON public.allergies FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('nurse', 'doctor', 'admin'));

CREATE POLICY "Clinical staff can view triage notes"
  ON public.triage_notes FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('nurse', 'doctor', 'director', 'admin'));

CREATE POLICY "Nurses can write triage notes"
  ON public.triage_notes FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('nurse', 'admin'));
