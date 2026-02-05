-- Ensure RLS is enabled
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;

-- Drop old insert policy if exists (safe)
DROP POLICY IF EXISTS "inventory_insert_ceo_manager" ON public.inventory_products;

-- Allow CEO always
-- Allow Manager only if inventory feature is enabled
CREATE POLICY "inventory_insert_ceo_manager"
ON public.inventory_products
FOR INSERT
WITH CHECK (
  public.is_ceo()
  OR (
    public.is_manager()
    AND public.has_feature('inventory')
  )
);
