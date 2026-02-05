
import React from "react";
import { getPublicSupabaseEnv, hasPublicSupabaseEnv } from "@/lib/env";

export default function EnvMissing() {
  const env = getPublicSupabaseEnv();
  const missing: string[] = [];
  if (!env.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length === 0) return null;
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-950 text-white">
      <div className="bg-blue-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">SCOUFF: Environment Missing</h2>
        <p className="mb-2">Required environment variables are missing:</p>
        <ul className="mb-4 text-blue-300">
          {missing.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
        <p className="text-sm text-blue-400">Please set these in your <span className="font-mono">.env.local</span> file and restart the dev server.</p>
      </div>
    </div>
  );
}
