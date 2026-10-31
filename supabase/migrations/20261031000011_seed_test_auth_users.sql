-- Migration: 20261031000011_seed_test_auth_users.sql
-- Description: Create 10 demo user accounts in auth.users with password 'Password123!' and assign roles

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
      v_users.id,
      '00000000-0000-0000-0000-000000000000',
      v_users.email,
      v_encrypted_pw,
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', v_users.full_name),
      now(), now(), 'authenticated', 'authenticated'
    )
    ON CONFLICT (id) DO UPDATE SET encrypted_password = v_encrypted_pw;

    INSERT INTO public.user_profiles (id, full_name, current_active_role)
    VALUES (v_users.id, v_users.full_name, v_users.primary_role)
    ON CONFLICT (id) DO UPDATE SET full_name = v_users.full_name, current_active_role = v_users.primary_role;

    FOREACH v_role IN ARRAY v_users.roles
    LOOP
      INSERT INTO public.user_roles (user_id, role, is_default)
      VALUES (v_users.id, v_role, v_role = v_users.primary_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
