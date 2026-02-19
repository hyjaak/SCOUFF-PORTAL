-- Ensure inventory_products RLS policies allow CEO and Manager (when feature enabled)

ALTER TABLE IF EXISTS public.inventory_products ENABLE ROW LEVEL SECURITY;

-- DROP existing conflicting policies to ensure deterministic state
DROP POLICY IF EXISTS inventory_select_feature ON public.inventory_products;
DROP POLICY IF EXISTS inventory_insert_feature ON public.inventory_products;
DROP POLICY IF EXISTS inventory_update_feature ON public.inventory_products;
DROP POLICY IF EXISTS inventory_delete_feature ON public.inventory_products;

-- SELECT: CEO OR (Manager with inventory feature) OR owner
CREATE POLICY inventory_select_feature ON public.inventory_products
  FOR SELECT
  USING (
    public.is_ceo()
    OR (public.is_manager() AND public.has_feature('inventory'))
    OR (inventory_products.created_by = auth.uid())
  );

-- INSERT: CEO OR Manager with inventory feature
CREATE POLICY inventory_insert_feature ON public.inventory_products
  FOR INSERT
  WITH CHECK (
    public.is_ceo()
    OR (public.is_manager() AND public.has_feature('inventory'))
  );

-- UPDATE: CEO OR Manager with inventory feature OR owner
CREATE POLICY inventory_update_feature ON public.inventory_products
  FOR UPDATE
  USING (
    public.is_ceo()
    OR (public.is_manager() AND public.has_feature('inventory'))
    OR (inventory_products.created_by = auth.uid())
  )
  WITH CHECK (
    public.is_ceo()
    OR (public.is_manager() AND public.has_feature('inventory'))
  );

-- DELETE: CEO OR Manager with inventory feature
CREATE POLICY inventory_delete_feature ON public.inventory_products
  FOR DELETE
  USING (
    public.is_ceo()
    OR (public.is_manager() AND public.has_feature('inventory'))
  );
