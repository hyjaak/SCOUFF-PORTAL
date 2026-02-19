import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeRole } from '@/lib/roles';

export async function getSessionUser() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (!user) return { user: null, role: 'MEMBER', email: null };

  // try to read profile role
  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
    const role = normalizeRole(profile?.role ?? null);
    return { user, role, email: user.email ?? null };
  } catch {
    const role = normalizeRole(null);
    return { user, role, email: user.email ?? null };
  }
}

export default getSessionUser;
