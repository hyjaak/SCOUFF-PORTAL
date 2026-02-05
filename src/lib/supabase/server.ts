import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSupabaseEnv } from '../env';


export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = requireSupabaseEnv();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        try {
          return Array.from(cookieStore.getAll()).map(({ name, value }) => ({ name, value }));
        } catch {
          return [];
        }
      },
      setAll(_cookies) {
        // No-op for SSR
      },
    },
  });
}
