"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 720, width: "100%" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>SCOUFF: App Error</h1>
        <p style={{ opacity: 0.8, marginBottom: 16 }}>
          Something crashed. This is better than a blank screen.
        </p>
        <pre style={{ whiteSpace: "pre-wrap", padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.2)" }}>
{String(error?.message ?? error)}
        </pre>
        <button
          onClick={() => reset()}
          style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
