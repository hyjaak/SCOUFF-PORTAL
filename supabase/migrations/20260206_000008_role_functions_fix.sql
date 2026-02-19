-- Ensure role-checking functions exist and are SECURITY DEFINER
-- Uses profiles table and role_feature_permissions for granular checks

-- is_ceo: returns true when current auth user has CEO-equivalent role
CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND upper(coalesce(p.role,'')) IN ('SUPER_ADMIN','SUPERADMIN','CEO')
  );
$$;

-- is_manager: returns true when current auth user has MANAGER-equivalent role
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND upper(coalesce(p.role,'')) IN ('BUSINESS_OWNER','BUSINESSOWNER','MANAGER','OWNER','ADMIN')
  );
$$;

-- has_feature: CEO always true; Managers depend on role_feature_permissions table
CREATE OR REPLACE FUNCTION public.has_feature(p_feature text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN public.is_ceo() THEN TRUE
    ELSE EXISTS(
      SELECT 1 FROM public.profiles pr
      JOIN public.role_feature_permissions rfp ON upper(coalesce(rfp.role,'')) = 'MANAGER'
      WHERE pr.user_id = auth.uid()
        AND rfp.feature = p_feature
        AND rfp.enabled = true
        AND upper(coalesce(pr.role,'')) IN ('BUSINESS_OWNER','BUSINESSOWNER','MANAGER','OWNER','ADMIN')
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION public.is_ceo() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_feature(text) TO anon, authenticated;
