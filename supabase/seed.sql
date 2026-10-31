-- Supabase local development seed data for Ticket 12
-- Deterministic and synthetic only. Never use in production.
-- Creates 160 synthetic patients distributed across queue states and seeds medication inventory.

DO $$
DECLARE
  i INTEGER;
  v_patient_id UUID;
  v_hn TEXT;
  v_vn TEXT;
  v_status visit_status;
  v_statuses visit_status[] := ARRAY[
    'registered'::visit_status, 'triaged'::visit_status, 'in_doctor'::visit_status,
    'pending_payment'::visit_status, 'pending_orders'::visit_status, 'doctor_review'::visit_status,
    'dispensing'::visit_status, 'completed'::visit_status
  ];
  v_status_index INTEGER;
  v_order_id UUID;
  v_user_id UUID;
BEGIN
  -- Synthetic auth accounts for local development. If Auth user IDs are not present, skip role seeding safely.
  FOR i IN 1..10 LOOP
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'demo.' || CASE i
      WHEN 1 THEN 'registrar'
      WHEN 2 THEN 'nurse'
      WHEN 3 THEN 'doctor'
      WHEN 4 THEN 'med_tech'
      WHEN 5 THEN 'nuclear_med'
      WHEN 6 THEN 'cashier'
      WHEN 7 THEN 'pharmacist'
      WHEN 8 THEN 'warehouse'
      WHEN 9 THEN 'admin'
      ELSE 'director'
    END || '@hospital.local'
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.user_profiles (id, full_name, current_active_role)
      VALUES (v_user_id, 'Demo ' || i, CASE i
        WHEN 1 THEN 'registrar'::hospital_role
        WHEN 2 THEN 'nurse'::hospital_role
        WHEN 3 THEN 'doctor'::hospital_role
        WHEN 4 THEN 'med_tech'::hospital_role
        WHEN 5 THEN 'nuclear_med'::hospital_role
        WHEN 6 THEN 'cashier'::hospital_role
        WHEN 7 THEN 'pharmacist'::hospital_role
        WHEN 8 THEN 'warehouse'::hospital_role
        WHEN 9 THEN 'admin'::hospital_role
        ELSE 'director'::hospital_role
      END)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.user_roles (user_id, role, is_default)
      VALUES (v_user_id, CASE i
        WHEN 1 THEN 'registrar'::hospital_role
        WHEN 2 THEN 'nurse'::hospital_role
        WHEN 3 THEN 'doctor'::hospital_role
        WHEN 4 THEN 'med_tech'::hospital_role
        WHEN 5 THEN 'nuclear_med'::hospital_role
        WHEN 6 THEN 'cashier'::hospital_role
        WHEN 7 THEN 'pharmacist'::hospital_role
        WHEN 8 THEN 'warehouse'::hospital_role
        WHEN 9 THEN 'admin'::hospital_role
        ELSE 'director'::hospital_role
      END, true)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END LOOP;

  -- Seed core inventory; ON CONFLICT keeps this script re-runnable.
  INSERT INTO public.medications (code, name, generic_name, drug_class, unit_price, total_stock, reserved_stock)
  VALUES
    ('MED-PARA-500', 'Paracetamol 500mg', 'Paracetamol', 'Analgesic / Antipyretic', 1.50, 5000, 0),
    ('MED-AMOX-500', 'Amoxicillin 500mg', 'Amoxicillin', 'Penicillin antibiotic', 4.00, 1500, 0),
    ('MED-IBU-400', 'Ibuprofen 400mg', 'Ibuprofen', 'NSAID', 2.50, 1000, 0),
    ('MED-OMEP-20', 'Omeprazole 20mg', 'Omeprazole', 'Proton pump inhibitor', 3.00, 1200, 0),
    ('MED-METF-500', 'Metformin 500mg', 'Metformin', 'Biguanide', 1.00, 2000, 0)
  ON CONFLICT (code) DO NOTHING;

  -- Generate 160 synthetic patients and visits.
  FOR i IN 1..160 LOOP
    v_hn := 'HN-2026-' || lpad(i::text, 6, '0');
    v_vn := 'VN-20261031-' || lpad(i::text, 4, '0');
    v_status_index := ((i - 1) % array_length(v_statuses, 1)) + 1;
    v_status := v_statuses[v_status_index];

    INSERT INTO public.patients (
      hn, national_id, first_name, last_name, gender, birth_date,
      blood_group, insurance_scheme, phone, outstanding_balance
    ) VALUES (
      v_hn,
      lpad((1000000000000 + i)::text, 13, '0'),
      CASE WHEN i % 2 = 0 THEN 'ผู้ป่วยจำลอง' ELSE 'Demo Patient' END,
      'Synthetic ' || i,
      CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
      date '1950-01-01' + ((i * 53) % 22000),
      (ARRAY['A', 'B', 'AB', 'O'])[((i - 1) % 4) + 1],
      (ARRAY['Universal Coverage', 'Social Security', 'Civil Servant', 'Self-pay'])[((i - 1) % 4) + 1],
      '080000' || lpad(i::text, 4, '0'),
      CASE WHEN i % 31 = 0 THEN 850 ELSE 0 END
    ) ON CONFLICT (hn) DO NOTHING;

    SELECT id INTO v_patient_id FROM public.patients WHERE hn = v_hn;

    INSERT INTO public.visits (vn, patient_id, hn, status, chief_complaint, triage_level)
    VALUES (
      v_vn,
      v_patient_id,
      v_hn,
      v_status,
      CASE WHEN i % 3 = 0 THEN 'Synthetic fever and cough' ELSE 'Synthetic routine follow-up' END,
      CASE WHEN i % 17 = 0 THEN 'urgent' ELSE 'routine' END
    ) ON CONFLICT (vn) DO NOTHING;

    IF i % 10 = 0 THEN
      INSERT INTO public.allergies (hn, drug_name, severity, reaction_details)
      VALUES (v_hn, 'Amoxicillin', 'severe_anaphylaxis', 'Synthetic seed allergy record')
      ON CONFLICT DO NOTHING;
    END IF;

    IF i % 8 = 0 THEN
      INSERT INTO public.vital_signs (
        visit_id, hn, systolic, diastolic, pulse_rate, body_temperature,
        respiratory_rate, weight_kg, height_cm
      )
      SELECT id, v_hn, 120, 80, 72, 36.8, 18, 65, 170
      FROM public.visits WHERE vn = v_vn
      ON CONFLICT DO NOTHING;
    END IF;

    IF i % 5 = 0 THEN
      INSERT INTO public.triage_notes (visit_id, hn, triage_level, chief_complaint, present_illness, nurse_notes)
      SELECT id, v_hn, 'routine', 'Synthetic visit complaint', 'Synthetic history', 'Seed data only'
      FROM public.visits WHERE vn = v_vn
      ON CONFLICT DO NOTHING;
    END IF;

    -- Seed a synthetic lab order and completed result for patients in lab/doctor-review queues.
    IF i % 7 = 0 THEN
      INSERT INTO public.orders (visit_id, hn, order_type, item_code, item_name, status, payment_type, payment_status, price)
      SELECT id, v_hn, 'lab', 'CBC', 'Complete Blood Count',
        CASE WHEN v_status IN ('doctor_review', 'completed') THEN 'completed'::order_status_enum ELSE 'ordered'::order_status_enum END,
        'pre_paid', 'paid', 250
      FROM public.visits WHERE vn = v_vn
      RETURNING id INTO v_order_id;

      IF v_order_id IS NOT NULL AND v_status IN ('doctor_review', 'completed') THEN
        INSERT INTO public.lab_results (order_id, visit_id, hn, test_name, result_value, reference_range, unit, flag)
        SELECT v_order_id, id, v_hn, 'CBC', 'Normal', 'WBC: 4,500-10,000', '/uL', 'normal'
        FROM public.visits WHERE vn = v_vn;
      END IF;
    END IF;

    -- Nuclear cases for the nuclear queue and relevant completed encounters.
    IF i % 40 = 0 THEN
      INSERT INTO public.orders (visit_id, hn, order_type, item_code, item_name, status, payment_type, details, price)
      SELECT id, v_hn, 'nuclear', 'NUC-TC99', 'Tc-99m Imaging', 'scheduled', 'post_paid',
        '{"radionuclide":"Tc-99m","simulated":true}'::jsonb, 1500
      FROM public.visits WHERE vn = v_vn;
    END IF;
  END LOOP;
END $$;
