-- =========================
-- ROLE CHECK FUNCTIONS
-- =========================

CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'ceo'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'manager'
  );
$$;

-- =========================
-- FEATURE CHECK FUNCTION
-- =========================

CREATE OR REPLACE FUNCTION public.has_feature(feature_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_features
    WHERE user_id = auth.uid()
      AND feature_key = feature_name
      AND enabled = true
  );
$$;

-- =========================
-- GRANTS (REQUIRED FOR RLS)
-- =========================

GRANT EXECUTE ON FUNCTION public.is_ceo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_feature(text) TO authenticated;
