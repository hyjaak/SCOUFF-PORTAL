import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { normalizeRole, isCEO } from "@/lib/roles";
import { getProfileRole } from "@/lib/profile";
import { canAccess } from "@/lib/access";

export default async function AuctionsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);
  if (!canAccess(role, "/dashboard/auctions")) redirect("/dashboard");
  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Auctions</h1>
      <p style={{ color: "#93c5fd", fontWeight: 600, marginBottom: 24 }}>Track active auctions and upcoming lots.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 24, color: "#fff", fontWeight: 600, fontSize: 20 }}>Auction Placeholder 1</div>
        <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 24, color: "#fff", fontWeight: 600, fontSize: 20 }}>Auction Placeholder 2</div>
      </div>
    </div>
  );
}
