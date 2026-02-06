

import "../globals.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPublicSupabaseEnv } from "@/lib/env";
import EnvMissing from "@/components/EnvMissing";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { redirect } from "next/navigation";
import { normalizeRole } from "@/lib/roles";
import { getProfileRole } from "@/lib/profile";

export const dynamic = "force-dynamic";

// Render Guard utility
async function safe<T>(asyncFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await asyncFn();
  } catch {
    return fallback;
  }
}

// CEO role detection helper
type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function getUserWithRole(supabase: SupabaseServerClient) {
  let user: { id: string; email?: string | null } | null = null;
  try {
    const result = await supabase.auth.getUser();
    const maybeUser = (result as unknown as { data?: { user?: { id: string; email?: string | null } } }).data?.user;
    user = maybeUser ?? null;
  } catch {
    user = null;
  }
  if (!user) return { id: "", email: "", role: "guest" };

  // Try to fetch profile from public.profiles
  const profileRole = await getProfileRole(supabase, user.id);
  return {
    id: user.id,
    email: user.email || "",
    role: profileRole || "member"
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const envOk = hasPublicSupabaseEnv();
  if (!envOk) {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <Sidebar role="guest" />
        <div className="flex flex-col flex-1 md:pl-64">
          <Topbar user={{ email: "", role: "guest" }} />
          <EnvMissing />
          <main className="flex-1 flex flex-col items-center p-8">{children}</main>
        </div>
      </div>
    );
  }
  const supabase = await safe(() => createServerSupabaseClient(), null);
  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <Sidebar role="guest" />
        <div className="flex flex-col flex-1 md:pl-64">
          <Topbar user={{ email: "", role: "guest" }} />
          <div className="bg-red-900 text-red-200 px-6 py-3 text-center font-bold">Supabase client unavailable.</div>
          <main className="flex-1 flex flex-col items-center p-8">{children}</main>
        </div>
      </div>
    );
  }
  const user = await getUserWithRole(supabase);
  if (!user.email || user.role === "guest") {
    redirect("/login");
    return null;
  }
  const normalizedRole = normalizeRole(user.role);
  let featureRows: Array<{ feature?: string | null; enabled?: boolean | null }> = [];
  if (normalizedRole !== "CEO") {
    try {
      const { data } = await supabase
        .from("role_feature_permissions")
        .select("feature, enabled")
        .eq("role", normalizedRole.toLowerCase());
      featureRows = data ?? [];
    } catch {
      featureRows = [];
    }
  }
  void featureRows;
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Sidebar role={normalizedRole} />
      <div className="flex flex-col flex-1 md:pl-64">
        <Topbar user={{ email: user.email, role: normalizedRole }} />
        {normalizedRole === "CEO" && (
          <div className="bg-yellow-900 text-yellow-200 px-6 py-3 text-center font-bold">CEO MODE ENABLED</div>
        )}
        <main className="flex-1 flex flex-col items-center p-8">{children}</main>
      </div>
    </div>
  );
}
