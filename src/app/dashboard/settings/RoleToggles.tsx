"use client";
import React, { useState, useEffect } from 'react';

export default function RoleToggles({ role = 'MANAGER' }: { role?: string }) {
  const [features, setFeatures] = useState<Array<{ feature: string; enabled: boolean }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/role-features?role=${role}`)
      .then((r) => r.json())
      .then((d) => setFeatures(d.data || []))
      .catch(() => setFeatures([]));
  }, [role]);

  async function toggle(feature: string, enabled: boolean) {
    setLoading(true);
    try {
      await fetch('/api/role-features', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role, feature, enabled }) });
      setFeatures((s) => s.map((f) => (f.feature === feature ? { ...f, enabled } : f)));
    } catch {}
    setLoading(false);
  }

  const allFeatures = ['inventory', 'auctions', 'admin', 'settings'];

  return (
    <div>
      <h3 className="text-lg font-semibold text-sky-300 mb-2">Manager Permissions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {allFeatures.map((f) => {
          const found = features.find((x) => x.feature === f);
          return (
            <label key={f} className="flex items-center gap-2">
              <input type="checkbox" checked={!!found?.enabled} onChange={(e) => toggle(f, e.target.checked)} />
              <span className="text-sky-200">{f}</span>
            </label>
          );
        })}
      </div>
      {loading && <div className="text-sky-300 mt-2">Saving...</div>}
    </div>
  );
}
