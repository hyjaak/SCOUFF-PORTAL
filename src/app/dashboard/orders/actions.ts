"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/company";

export async function createTestOrderAction() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const active = await getActiveCompanyId(supabase, user.id);
  if (!active.companyId) throw new Error("No active company");

  // Fetch a sample product from the company's inventory
  let productName = "Sample Item";
  let productSku = "SAMPLE-001";
  let unitPrice = 9999; // $99.99 in cents

  const { data: products } = await supabase
    .from("inventory_products")
    .select("id, sku, name, retail_price")
    .eq("company_id", active.companyId)
    .limit(1);

  if (products && products.length > 0) {
    const product = products[0];
    productName = product.name;
    productSku = product.sku;
    // Convert retail_price (assuming it's a decimal) to cents
    unitPrice = Math.round((product.retail_price as number) * 100);
  }

  const lineTotal = unitPrice;
  const grossAmount = lineTotal;
  const platformFee = 0; // No platform fee yet
  const netAmount = grossAmount - platformFee;

  // Create order
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        company_id: active.companyId,
        created_by: user.id,
        status: "pending",
        currency: "USD",
        gross_amount_cents: grossAmount,
        platform_fee_cents: platformFee,
        net_amount_cents: netAmount,
      },
    ])
    .select()
    .single();

  if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);
  if (!orderData) throw new Error("Order creation returned no data");

  // Create order item
  const { error: itemError } = await supabase
    .from("order_items")
    .insert([
      {
        order_id: orderData.id,
        product_id: products?.[0]?.id ?? null,
        sku: productSku,
        name: productName,
        qty: 1,
        unit_price_cents: unitPrice,
        line_total_cents: lineTotal,
      },
    ]);

  if (itemError) throw new Error(`Failed to create order item: ${itemError.message}`);

  return orderData;
}
