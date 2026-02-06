import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProfileRole } from "@/lib/profile";
import { normalizeRole } from "@/lib/permissions";
import FormField from "@/components/FormField";
import ManagerPermissionsClient from "@/app/admin/ManagerPermissionsClient";

export default async function DashboardAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);
  if (role !== "ceo") redirect("/dashboard");

  const { data: perms } = await supabase
    .from("role_feature_permissions")
    .select("role, feature, enabled")
    .eq("role", "manager");
  const rolePermissions = perms ?? [];

  const { data: profileRows } = await supabase.from("profiles").select("id, user_id, email, role");
  const profiles = (profileRows ?? [])
    .map((row) => ({
      id: (row as { user_id?: string | null; id?: string | null }).user_id || (row as { id?: string | null }).id || "",
      email: (row as { email?: string | null }).email ?? null,
      role: (row as { role?: string | null }).role ?? null,
    }))
    .filter((row) => row.id && normalizeRole(row.role) !== "ceo");

  return (
    <div className="w-full max-w-3xl">
      <h1 className="text-3xl font-bold text-neon-blue mb-6">Admin</h1>
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-blue-300 mb-2">Create Invite</h2>
        <form className="bg-[#131c2e] p-6 rounded-lg border border-blue-900 flex flex-col gap-4">
          <FormField label="Email">
            <input type="email" className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white w-full" required />
          </FormField>
          <FormField label="Role">
            <select className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white w-full">
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="ceo">CEO</option>
            </select>
          </FormField>
          <button type="submit" className="bg-blue-700 hover:bg-blue-900 text-white font-semibold py-2 rounded transition">Create Invite</button>
        </form>
      </section>
      <ManagerPermissionsClient profiles={profiles} permissions={rolePermissions} />
    </div>
  );
}
