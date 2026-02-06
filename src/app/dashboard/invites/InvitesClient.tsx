"use client";
import React, { useState } from "react";
import { roleLabel, normalizeRole } from "@/lib/roles";

type Invite = {
  email: string;
  role: string;
  created_at?: string | null;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

export default function InvitesClient({ invites: initialInvites }: { invites: Invite[] }) {
  const [invites, setInvites] = useState(initialInvites);
  const [inviteEmail, setInviteEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // TODO: call an API route or server action to create invite
      setInvites([{ email: inviteEmail, role, created_at: new Date().toISOString() }, ...invites]);
      setInviteEmail("");
      setRole("MEMBER");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create invite"));
    }
    setLoading(false);
  }

  function copyInvite(email: string) {
    const url = typeof window !== "undefined" ? `${window.location.origin}/invite/${email}` : `/invite/${email}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url);
  }

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Invites</h1>
      <form onSubmit={handleCreateInvite} style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <input
          type="email"
          placeholder="Invite email"
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 8, border: "1px solid #1e3a8a", background: "#101a2b", color: "#fff", fontWeight: 500, fontSize: 16, flex: 2 }}
        />
        <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #1e3a8a", background: "#101a2b", color: "#fff", fontWeight: 500, fontSize: 16, flex: 1 }}>
          <option value="MEMBER">Member</option>
          <option value="MANAGER">Manager</option>
          <option value="CEO">Super Admin</option>
        </select>
        <button type="submit" disabled={loading} style={{ background: "#38bdf8", color: "#fff", fontWeight: 700, border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 18 }}>
          {loading ? "Creating..." : "Create Invite"}
        </button>
      </form>
      {error && <div style={{ color: "#f87171", marginBottom: 16 }}>{error}</div>}
      {invites.length === 0 ? (
        <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 32, color: "#fff", fontWeight: 600, fontSize: 20 }}>No invites yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {invites.map((inv) => (
            <div key={inv.email} style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 24, color: "#fff", fontWeight: 500, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, color: "#38bdf8", fontWeight: 700 }}>{inv.email}</div>
                <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 4 }}>Role: {roleLabel(normalizeRole(inv.role))} | Created {inv.created_at ? new Date(inv.created_at).toLocaleString() : ""}</div>
              </div>
              <button onClick={() => copyInvite(inv.email)} style={{ background: "#101a2b", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: 6, padding: "8px 18px", fontWeight: 700, fontSize: 15, marginRight: 8 }}>Copy Invite Link</button>
              <a href={`/invite/${inv.email}`} style={{ background: "#38bdf8", color: "#fff", borderRadius: 6, padding: "8px 18px", fontWeight: 700, fontSize: 15, textDecoration: "none", marginRight: 8 }}>Open</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
