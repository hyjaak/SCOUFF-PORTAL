import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InventoryClient from "./InventoryClient";
import { getInventoryProducts } from "@/lib/inventory";
import { buildFeatureMap, normalizeRole } from "@/lib/permissions";
import { getProfileRole } from "@/lib/profile";

export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
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
  const products = await getInventoryProducts();
  return <InventoryClient initialProducts={products || []} />;
}
