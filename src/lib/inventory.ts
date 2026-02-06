// src/lib/inventory.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type InventoryProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  quantity: number;
  unit_cost: number | null;
  retail_price: number;
  status: "draft" | "active" | "archived";
  company_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateInventoryProductInput = {
  sku: string;
  name: string;
  category: string;
  description?: string;
  quantity?: number;
  unit_cost?: number;
  retail_price?: number;
  status?: "draft" | "active" | "archived";
  company_id?: string | null;
  created_by?: string | null;
};

export async function getInventoryProducts() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("inventory_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryProduct[];
}

export async function createInventoryProduct(input: CreateInventoryProductInput) {
  const supabase = await createServerSupabaseClient();

  const payload: {
    sku: string;
    name: string;
    category: string;
    description: string | null;
    quantity: number;
    status: "draft" | "active" | "archived";
    unit_cost?: number | null;
    retail_price?: number | null;
    company_id?: string | null;
    created_by?: string | null;
  } = {
    sku: input.sku.trim(),
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description?.trim() || null,
    quantity: Number.isFinite(input.quantity) ? Math.max(0, Number(input.quantity)) : 0,
    status: input.status ?? "draft",
  };

  if (input.unit_cost != null) {
    payload.unit_cost = Number.isFinite(input.unit_cost) ? Number(input.unit_cost) : null;
  }

  if (input.retail_price != null) {
    payload.retail_price = Number.isFinite(input.retail_price) ? Number(input.retail_price) : null;
  }

  if (input.company_id) {
    payload.company_id = input.company_id;
  }
  if (input.created_by) {
    payload.created_by = input.created_by;
  }

  const { data, error } = await supabase
    .from("inventory_products")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as InventoryProduct;
}
