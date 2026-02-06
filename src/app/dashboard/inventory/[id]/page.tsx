import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import React from "react";
import { buildFeatureMap, normalizeRole } from "@/lib/permissions";
import { getProfileRole } from "@/lib/profile";

export default async function ProductIntelView({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Get role from profiles
  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);
  if (role !== "ceo") {
    const { data } = await supabase
      .from("role_feature_permissions")
      .select("feature, enabled")
      .eq("role", role)
      .eq("feature", "inventory");
    const features = buildFeatureMap(role, data ?? []);
    if (!features.inventory) redirect("/dashboard");
  }
  // Fetch product
  const { data: product, error } = await supabase.from("inventory_products").select("*").eq("id", params.id).single();
  if (!product) return <div className="bg-red-900 text-red-200 px-6 py-3 text-center font-bold mt-8">Product not found</div>;
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-sky-400 mb-8">Product Intel</h1>
      {error && <div className="bg-red-900 text-red-200 px-6 py-3 text-center font-bold mb-4">{error.message}</div>}
      <div className="bg-[#131c2e] border border-blue-900 rounded-xl p-8 shadow-md">
        <div className="text-lg font-bold text-sky-300 mb-2 flex items-center">{product.codename}</div>
        <div className="text-blue-200 text-sm mb-1">Category: <span className="font-semibold">{product.category}</span></div>
        <div className="text-blue-200 text-sm mb-1">Quantity: <span className="font-semibold">{product.quantity}</span></div>
        <div className="text-blue-200 text-sm mb-1">Status: <span className="font-semibold">{product.status}</span></div>
        <div className="text-blue-200 text-sm mb-1">Access: <span className="font-semibold">{product.access_level}</span></div>
        <div className="text-blue-200 text-xs mt-2">SKU: {product.sku}</div>
        <div className="text-blue-200 text-xs mt-2">Created: {new Date(product.created_at).toLocaleString()}</div>
        <div className="text-blue-200 text-xs mt-2">Updated: {new Date(product.updated_at).toLocaleString()}</div>
        <div className="text-blue-200 text-sm mt-4">{product.description}</div>
        {role === "ceo" ? (
          <div className="mt-8 p-4 bg-blue-950 border border-blue-700 rounded text-blue-200 font-bold">CEO Controls (edit, delete, etc.) — Placeholder</div>
        ) : (
          <div className="mt-8 p-4 bg-gray-900 border border-gray-700 rounded text-gray-300 font-semibold">Read-only view</div>
        )}
      </div>
    </div>
  );
}
