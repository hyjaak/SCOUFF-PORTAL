import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InventoryClient from "./InventoryClient";
import { getInventoryProducts } from "@/lib/inventory";

export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const products = await getInventoryProducts();
  return <InventoryClient initialProducts={products || []} />;
}
