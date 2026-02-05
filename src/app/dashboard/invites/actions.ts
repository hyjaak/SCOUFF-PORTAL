import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listInvites(userEmail?: string) {
  // TODO: add admin check if needed
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("invites").select("*");
  if (error) return [];
  return data || [];
}

export async function createInvite(userEmail: string, inviteEmail: string, role: string = "member") {
  // TODO: add admin check if needed
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Supabase client missing");
  const { data, error } = await supabase.from("invites").insert([{ email: inviteEmail, role }]).select().single();
  if (error) throw new Error(error.message);
  return data;
}
