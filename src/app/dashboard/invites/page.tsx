
import InvitesClient from "./InvitesClient";
import { listInvites } from "./actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { buildFeatureMap } from "@/lib/permissions";
import { normalizeRole, isCEO } from "@/lib/roles";
import { getProfileRole } from "@/lib/profile";

type Invite = {
  email: string;
  role: string;
  created_at?: string | null;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

export default async function InvitesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);
  if (!isCEO(role)) {
    const { data } = await supabase
      .from("role_feature_permissions")
      .select("feature, enabled")
      .eq("role", role.toLowerCase())
      .eq("feature", "invites");
    const features = buildFeatureMap(role, data ?? []);
    if (!features.invites) redirect("/dashboard");
  }
  let invites: Invite[] = [];
  let error = "";
  try {
    // TODO: fetch user email from session if needed
    invites = (await listInvites()) as Invite[];
  } catch (e: unknown) {
    error = getErrorMessage(e, "Failed to load invites");
  }
  // Render error or pass invites to client component
  if (error) {
    return (
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Invites</h1>
        <div style={{ color: "#f87171", marginBottom: 16 }}>{error}</div>
      </div>
    );
  }
  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Invites</h1>
      <InvitesClient invites={invites} />
    </div>
  );
}
