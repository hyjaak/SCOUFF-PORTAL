export default function AuctionsPage() {
  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Auctions</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 24, color: "#fff", fontWeight: 600, fontSize: 20 }}>Auction Placeholder 1</div>
        <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 24, color: "#fff", fontWeight: 600, fontSize: 20 }}>Auction Placeholder 2</div>
      </div>
    </div>
  );
}
