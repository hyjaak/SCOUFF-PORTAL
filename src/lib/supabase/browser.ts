import { createBrowserClient } from "@supabase/ssr";
import { requirePublicSupabaseEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

export const supabase = (() => {
  if (!client) {
    const { url, anonKey } = requirePublicSupabaseEnv();
    client = createBrowserClient(url, anonKey);
  }
  return client;
})();
