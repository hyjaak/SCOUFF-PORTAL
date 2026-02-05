-- 1) Create role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('ceo', 'manager', 'member');
  END IF;
END$$;

-- 2) Ensure profiles table has a role column (adapt table name if your project uses a different one)
-- If your project uses public.profiles(id uuid primary key references auth.users), keep that.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='profiles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
    ) THEN
      ALTER TABLE public.profiles
        ADD COLUMN role public.app_role NOT NULL DEFAULT 'member';
    END IF;
  END IF;
END$$;

-- 3) Manager permissions table
CREATE TABLE IF NOT EXISTS public.manager_permissions (
  manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (manager_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_manager_permissions_manager
  ON public.manager_permissions(manager_id);

-- 4) Helper: current user's role (security definer for RLS checks)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()),
    'member'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'ceo'::public.app_role;
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'manager'::public.app_role;
$$;

-- 5) Feature check (CEO always true)
CREATE OR REPLACE FUNCTION public.has_feature(p_feature_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN public.is_ceo() THEN true
      WHEN public.is_manager() THEN COALESCE(
        (SELECT mp.enabled
         FROM public.manager_permissions mp
         WHERE mp.manager_id = auth.uid()
           AND mp.feature_key = p_feature_key),
        false
      )
      ELSE false
    END;
$$;

-- 6) RLS
ALTER TABLE public.manager_permissions ENABLE ROW LEVEL SECURITY;

-- CEO can read/write all permissions
DROP POLICY IF EXISTS "CEO full access" ON public.manager_permissions;
CREATE POLICY "CEO full access"
ON public.manager_permissions
FOR ALL
USING (public.is_ceo())
WITH CHECK (public.is_ceo());

-- Managers can read their own permissions (read-only)
DROP POLICY IF EXISTS "Manager read own permissions" ON public.manager_permissions;
CREATE POLICY "Manager read own permissions"
ON public.manager_permissions
FOR SELECT
USING (auth.uid() = manager_id);

-- 7) (Optional but recommended) Ensure profiles RLS allows CEO to update roles safely
-- Enable RLS on profiles only if project already uses it; otherwise skip to avoid breaking auth.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='profiles'
  ) THEN
    -- If profiles already has RLS enabled, add a CEO update policy.
    IF EXISTS (
      SELECT 1 FROM pg_catalog.pg_policies
      WHERE schemaname='public' AND tablename='profiles'
    ) THEN
      -- no-op (we will add specific policy below)
      NULL;
    END IF;
  END IF;
END$$;

-- Add policy only if RLS is enabled; safe guard
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='profiles'
  ) THEN
    -- check if RLS enabled
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname='profiles' AND c.relrowsecurity = true
    ) THEN
      DROP POLICY IF EXISTS "CEO can update roles" ON public.profiles;
      CREATE POLICY "CEO can update roles"
      ON public.profiles
      FOR UPDATE
      USING (public.is_ceo())
      WITH CHECK (public.is_ceo());
    END IF;
  END IF;
END$$;
