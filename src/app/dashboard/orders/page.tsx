import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProfileRole } from "@/lib/profile";
import { normalizeRole } from "@/lib/roles";
import { canAccess } from "@/lib/access";
import { listOrdersForCurrentCompany } from "@/lib/orders";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);
  if (!canAccess(role, "/dashboard/orders")) redirect("/dashboard");

  const orders = await listOrdersForCurrentCompany();

  return <OrdersClient initialOrders={orders} role={role} />;
}
