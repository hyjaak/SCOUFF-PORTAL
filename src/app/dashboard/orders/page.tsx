import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProfileRole } from "@/lib/profile";
import { normalizeRole } from "@/lib/roles";
import { canAccess } from "@/lib/access";

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);
  if (!canAccess(role, "/dashboard/orders")) redirect("/dashboard");

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Orders</h1>
      <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 32, color: "#fff", fontWeight: 600, fontSize: 20 }}>
        No orders yet.
      </div>
    </div>
  );
}
