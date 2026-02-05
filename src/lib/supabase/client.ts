import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseEnv } from '../env';

export function createClientBrowser() {
  const env = getPublicSupabaseEnv();
  if (!env.url || !env.anonKey) return null;
  return createBrowserClient(env.url, env.anonKey);
}
