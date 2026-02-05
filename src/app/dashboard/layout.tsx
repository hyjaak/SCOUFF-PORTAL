

import "../globals.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPublicSupabaseEnv } from "@/lib/env";
import EnvMissing from "@/components/EnvMissing";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { redirect } from "next/navigation";

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
  if (!user) return { email: "", role: "guest" };

  // Try to fetch profile from public.profiles
  let profileRole: string | null = null;
  try {
    const result = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const roleValue = (result as unknown as { data?: { role?: unknown } | null }).data?.role;
    if (typeof roleValue === "string") profileRole = roleValue;
  } catch {
    profileRole = null;
  }
  return {
    email: user.email || "",
    role: profileRole || "member"
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const envOk = hasPublicSupabaseEnv();
  if (!envOk) {
    return (
      <div className="min-h-screen flex bg-[#0a0e1a]">
        <Sidebar role="guest" />
        <div className="flex flex-col flex-1">
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
      <div className="min-h-screen flex bg-[#0a0e1a]">
        <Sidebar role="guest" />
        <div className="flex flex-col flex-1">
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
  return (
    <div className="min-h-screen flex bg-[#0a0e1a]">
      <Sidebar role={user.role} />
      <div className="flex flex-col flex-1">
        <Topbar user={user} />
        {user.role === "ceo" && (
          <div className="bg-yellow-900 text-yellow-200 px-6 py-3 text-center font-bold">CEO MODE ENABLED</div>
        )}
        <main className="flex-1 flex flex-col items-center p-8">{children}</main>
      </div>
    </div>
  );
}
