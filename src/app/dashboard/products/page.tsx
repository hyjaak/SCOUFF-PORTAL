import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InventoryClient from "../inventory/InventoryClient";
import { getInventoryProducts } from "@/lib/inventory";
import { normalizeRole, isCEO, isManager } from "@/lib/roles";
import { getProfileRole } from "@/lib/profile";
import { canAccess } from "@/lib/access";

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);
  if (!canAccess(role, "/dashboard/products")) redirect("/dashboard");
  const products = await getInventoryProducts();
  const canEdit = isCEO(role) || isManager(role);
  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-3xl font-bold text-sky-400 mb-2">Products</h1>
      <p className="mb-6 text-sky-300 font-medium text-lg">Manage and review inventory for your company.</p>
      <InventoryClient initialProducts={products || []} canEdit={canEdit} />
    </div>
  );
}
