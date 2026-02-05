// src/lib/contracts.ts

export async function assertContracts() {
  // Env contract
  const env = await import('./env');
  if (typeof env.hasPublicSupabaseEnv !== 'function') throw new Error('hasPublicSupabaseEnv missing from env.ts');
  if (typeof env.requireSupabaseEnv !== 'function') throw new Error('requireSupabaseEnv missing from env.ts');

  // Browser contract
  const browser = await import('./supabase/browser');
  if (typeof browser.supabase === 'undefined') throw new Error('supabase missing from browser.ts');
  if (typeof browser.createBrowserSupabaseClient !== 'function') throw new Error('createBrowserSupabaseClient missing from browser.ts');

  // Server contract
  const server = await import('./supabase/server');
  if (typeof server.createServerSupabaseClient !== 'function') throw new Error('createServerSupabaseClient missing from server.ts');
}
