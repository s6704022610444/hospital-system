-- Migration: 20261031000001_foundation_and_roles.sql
-- Description: 10 Hospital Roles, User Profiles, Auth Hook, and Active Role Switcher RPC

CREATE TYPE hospital_role AS ENUM (
  'registrar',
  'nurse',
  'doctor',
  'med_tech',
  'nuclear_med',
  'cashier',
  'pharmacist',
  'warehouse',
  'admin',
  'director'
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  license_number TEXT,
  current_active_role hospital_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

-- User Roles table (1 user can have multiple roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role hospital_role NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- OCC Trigger Function
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

CREATE TRIGGER trg_user_profiles_occ
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

CREATE TRIGGER trg_user_roles_occ
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_occ_update();

-- Custom Access Token Hook for Supabase Auth (Injects active_role and roles array into JWT claims)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_roles_list text[];
  v_active_role text;
BEGIN
  -- Fetch all roles assigned to user
  SELECT array_agg(role::text) INTO user_roles_list
  FROM public.user_roles
  WHERE user_id = (event->>'user_id')::uuid;

  -- Fetch current active role from profile
  SELECT current_active_role::text INTO v_active_role
  FROM public.user_profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF claims->'app_metadata' IS NULL THEN
    claims := jsonb_set(claims, '{app_metadata}', '{}');
  END IF;

  claims := jsonb_set(claims, '{app_metadata,roles}', to_jsonb(coalesce(user_roles_list, ARRAY[]::text[])));
  claims := jsonb_set(claims, '{app_metadata,active_role}', to_jsonb(coalesce(v_active_role, '')));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for switching active role safely
CREATE OR REPLACE FUNCTION public.switch_active_role(p_new_role hospital_role)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user has this role assigned
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND role = p_new_role
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Permission denied: Role % is not assigned to this user.', p_new_role;
  END IF;

  -- Update profile active role
  UPDATE public.user_profiles
  SET current_active_role = p_new_role
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'active_role', p_new_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'active_role') IN ('admin', 'director'));

CREATE POLICY "Users can view own assigned roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'active_role') = 'admin');

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'active_role') = 'admin');
