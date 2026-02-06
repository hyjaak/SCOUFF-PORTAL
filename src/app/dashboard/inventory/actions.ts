'use server';

import { createInventoryProduct, type InventoryProduct } from '@/lib/inventory';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === 'string') return maybeMessage;
  }
  return fallback;
}

export type CreateInventoryProductInput = {
  sku: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  retail_price: number;
  status: 'draft' | 'active' | 'archived';
};

export type UpdateInventoryProductInput = {
  name: string;
  category: string;
  description?: string;
  quantity: number;
  retail_price: number;
  status: 'draft' | 'active' | 'archived';
};

export async function createInventoryProductAction(input: CreateInventoryProductInput): Promise<ActionResult<InventoryProduct>> {
  // Basic normalization (keep light; RLS/DB constraints are the real guards)
  const cleanedSku = input.sku?.trim();
  if (!cleanedSku) {
    return { ok: false, error: "SKU is required" };
  }
  const payload = {
    sku: cleanedSku,
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description?.trim() || undefined,
    quantity: Number.isFinite(input.quantity) ? input.quantity : 0,
    retail_price: Number.isFinite(input.retail_price) ? input.retail_price : 0,
    status: input.status ?? 'draft',
  };

  try {
    const created = await createInventoryProduct(payload);
    return { ok: true, data: created };
  } catch (err: unknown) {
    console.error('createInventoryProductAction failed', err);
    return { ok: false, error: getErrorMessage(err, 'Failed to add product') };
  }
}

export async function updateInventoryProductAction(id: string, input: UpdateInventoryProductInput) {
  const supabase = await createServerSupabaseClient();

  const payload = {
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description?.trim() || null,
    quantity: Number.isFinite(input.quantity) ? Math.max(0, Number(input.quantity)) : 0,
    retail_price: Number.isFinite(input.retail_price) ? Math.max(0, Number(input.retail_price)) : 0,
    status: input.status ?? 'draft',
  };

  const { data, error } = await supabase
    .from('inventory_products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('updateInventoryProductAction failed', error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteInventoryProductAction(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createServerSupabaseClient();

  try {
    const { error } = await supabase
      .from('inventory_products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { ok: true, data: { id } };
  } catch (err: unknown) {
    console.error('deleteInventoryProductAction failed', err);
    return { ok: false, error: getErrorMessage(err, 'Failed to delete product') };
  }
}

export type InventoryAdjustmentInput = {
  direction: 'in' | 'out';
  amount: number;
  reason: 'purchase' | 'sale' | 'return' | 'damage' | 'correction' | 'transfer' | 'other';
  note?: string;
};

export async function applyInventoryAdjustmentAction(productId: string, input: InventoryAdjustmentInput) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc('apply_inventory_adjustment', {
    p_product_id: productId,
    p_direction: input.direction,
    p_amount: input.amount,
    p_reason: input.reason,
    p_note: input.note ?? null,
  });

  if (error) throw new Error(error.message);

  let newQuantity: unknown;
  if (Array.isArray(data)) {
    const first = data[0];
    if (first && typeof first === 'object') {
      newQuantity = (first as Record<string, unknown>).new_quantity;
    }
  } else if (data && typeof data === 'object') {
    newQuantity = (data as Record<string, unknown>).new_quantity;
  }

  if (typeof newQuantity !== 'number') throw new Error('Adjustment failed');
  return { new_quantity: newQuantity };
}
