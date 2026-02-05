"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import EnvMissing from "@/components/EnvMissing";

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-white flex items-center justify-center p-6">
      <EnvMissing />

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold text-sky-300">SCOUFF</h1>
        <p className="text-white/70 mt-1">Private Portal Login</p>

        <form onSubmit={onLogin} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Password</label>
            <input
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              type="password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-300 border border-red-500/30 bg-red-500/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            disabled={busy}
            className="w-full rounded-lg bg-sky-500/20 hover:bg-sky-500/25 border border-sky-400/30 px-4 py-2 font-semibold"
          >
            {busy ? "Signing in..." : "Enter Control Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
