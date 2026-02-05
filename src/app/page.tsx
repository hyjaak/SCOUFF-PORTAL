export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 48, minWidth: 340, textAlign: "center" }}>
        <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 36, marginBottom: 24 }}>SCOUFF</h1>
        <p style={{ color: "#fff", fontWeight: 500, marginBottom: 32 }}>Invite-only private operations</p>
        <a href="/dashboard" style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600 }}>Enter Control Room</a>
      </div>
    </main>
  );
}
