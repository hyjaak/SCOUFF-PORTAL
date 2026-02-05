// src/lib/env.ts
export type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { url, anonKey };
}


export function hasPublicSupabaseEnv(): boolean {
  const { url, anonKey } = getPublicSupabaseEnv();
  return !!url && !!anonKey;
}

// Contract: requireSupabaseEnv must exist for SSR/server helpers
export const requireSupabaseEnv = requirePublicSupabaseEnv;

export function requirePublicSupabaseEnv(): PublicSupabaseEnv {
  const env = getPublicSupabaseEnv();
  if (!env.url || !env.anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return env;
}
