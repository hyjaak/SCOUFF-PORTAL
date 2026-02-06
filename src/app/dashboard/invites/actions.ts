import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/roles";

export async function listInvites(userEmail?: string) {
  // TODO: add admin check if needed
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("invites").select("*");
  if (error) return [];
  return data || [];
}

export async function createInvite(userEmail: string, inviteEmail: string, role: string = "MEMBER") {
  // TODO: add admin check if needed
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase client missing");
  const normalizedRole = normalizeRole(role);
  const { data, error } = await supabase
    .from("invites")
    .insert([{ email: inviteEmail, role: normalizedRole }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
