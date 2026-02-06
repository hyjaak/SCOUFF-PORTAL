export async function getProfileRole(
  supabase: { from: (table: string) => any },
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.from("profiles").select("role").eq("user_id", userId).single();
    if (!error && data?.role) return data.role as string;
  } catch {
    // ignore and fall back
  }

  try {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (!error && data?.role) return data.role as string;
  } catch {
    // ignore
  }

  return null;
}
