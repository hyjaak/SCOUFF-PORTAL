import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { buildFeatureMap, normalizeRole } from "@/lib/permissions";
import { getProfileRole } from "@/lib/profile";
import ManagerPermissionsClient from "@/app/admin/ManagerPermissionsClient";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);
  let founderShareBps = 0;
  let companyName = "";
  if (role === "ceo") {
    const { data: rule } = await supabase
      .from("founder_share_rules")
      .select("share_bps")
      .eq("company_id", null)
      .eq("enabled", true)
      .single();
    founderShareBps = rule?.share_bps ?? 0;
  }
  const { data: memberRow } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (memberRow?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", memberRow.company_id)
      .single();
    companyName = company?.name ?? "";
  }
  if (role !== "ceo") {
    const { data } = await supabase
      .from("role_feature_permissions")
      .select("feature, enabled")
      .eq("role", role)
      .eq("feature", "settings");
    const features = buildFeatureMap(role, data ?? []);
    if (!features.settings) redirect("/dashboard");
  }

  let rolePermissions: Array<{ role: string; feature: string; enabled: boolean }> = [];
  let profiles: Array<{ id: string; email?: string | null; role?: string | null }> = [];
  if (role === "ceo") {
    const { data: perms } = await supabase
      .from("role_feature_permissions")
      .select("role, feature, enabled")
      .eq("role", "manager");
    rolePermissions = perms ?? [];

    const { data: profileRows } = await supabase.from("profiles").select("id, user_id, email, role");
    profiles = (profileRows ?? [])
      .map((row) => ({
        id: (row as { user_id?: string | null; id?: string | null }).user_id || (row as { id?: string | null }).id || "",
        email: (row as { email?: string | null }).email ?? null,
        role: (row as { role?: string | null }).role ?? null,
      }))
      .filter((row) => row.id && normalizeRole(row.role) !== "ceo");
  }
  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Settings</h1>
      <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #1e3a8a", padding: 16, color: "#93c5fd", fontWeight: 600, marginBottom: 24 }}>
        Founder share is automatically reserved on every payment.
      </div>
      {role === "ceo" && (
        <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 20, color: "#fff", fontWeight: 600, marginBottom: 24 }}>
          Founder share percentage (read-only): {(founderShareBps / 100).toFixed(2)}%
        </div>
      )}
      <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 20, color: "#fff", fontWeight: 600, marginBottom: 24 }}>
        Company settings: {companyName || "Unassigned"}
      </div>
      {role === "ceo" && (
        <ManagerPermissionsClient profiles={profiles} permissions={rolePermissions} />
      )}
      <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 32, color: "#fff", fontWeight: 600, fontSize: 20 }}>Settings Placeholder</div>
    </div>
  );
}
