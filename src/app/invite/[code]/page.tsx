
import React from "react";

export default function InvitePage({ params }: { params: { code?: string } }) {
  const code = params?.code || "(invalid invite code)";
  return (
    <main style={{ minHeight: "100vh", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 48, minWidth: 340, textAlign: "center" }}>
        <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 32, marginBottom: 24 }}>SCOUFF Invite</h1>
        <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: 22, marginBottom: 16 }}>{code}</div>
        <p style={{ color: "#fff", fontWeight: 500, marginBottom: 24 }}>Invite-only private operations. Use this invite to request access.</p>
        <a href="/login" style={{ background: "#38bdf8", color: "#fff", fontWeight: 700, borderRadius: 8, padding: "12px 32px", fontSize: 18, textDecoration: "none", display: "inline-block", marginBottom: 16 }}>Continue to Login</a>
        <div style={{ color: "#a3a3a3", fontSize: 13, marginTop: 16 }}>This is a preview. Verification will be enforced soon.</div>
      </div>
    </main>
  );
}
