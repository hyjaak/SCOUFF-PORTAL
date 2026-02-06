"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type FeatureKey } from "@/lib/permissions";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

export async function setRoleFeaturePermissionAction(
  role: "manager" | "member",
  featureKey: FeatureKey,
  enabled: boolean
): Promise<ActionResult<{ role: string; feature: FeatureKey; enabled: boolean }>> {
  const supabase = await createServerSupabaseClient();
  try {
    const { data, error } = await supabase
      .from("role_feature_permissions")
      .upsert({ role, feature: featureKey, enabled }, { onConflict: "role,feature" })
      .select("role, feature, enabled")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, data: data as { role: string; feature: FeatureKey; enabled: boolean } };
  } catch (err: unknown) {
    console.error("setRoleFeaturePermissionAction failed", err);
    return { ok: false, error: getErrorMessage(err, "Failed to update permission") };
  }
}

export async function setUserRoleAction(
  userId: string,
  role: "ceo" | "manager" | "member"
): Promise<ActionResult<{ id: string; role: string }>> {
  const supabase = await createServerSupabaseClient();
  try {
    let updated = null;
    const primary = await supabase
      .from("profiles")
      .update({ role })
      .eq("user_id", userId)
      .select("user_id, id, role")
      .single();
    if (!primary.error && primary.data) {
      updated = primary.data;
    } else {
      const fallback = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select("user_id, id, role")
        .single();
      if (fallback.error) throw new Error(fallback.error.message);
      updated = fallback.data;
    }
    return { ok: true, data: { id: (updated?.user_id ?? updated?.id) as string, role: updated?.role as string } };
  } catch (err: unknown) {
    console.error("setUserRoleAction failed", err);
    return { ok: false, error: getErrorMessage(err, "Failed to update role") };
  }
}
