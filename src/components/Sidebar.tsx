import React from 'react';
import Link from 'next/link';
import { type FeatureMap, normalizeRole } from '@/lib/permissions';

export default function Sidebar({ role, features }: { role: string; features?: FeatureMap }) {
  const normalizedRole = normalizeRole(role);
  const canSee = (featureKey: keyof FeatureMap) => {
    if (normalizedRole === "ceo") return true;
    return Boolean(features?.[featureKey]);
  };
  return (
    <aside className="w-64 h-full bg-[#101a2b] border-r border-blue-900 flex flex-col p-6">
      <div className="mb-8">
        <span className="text-2xl font-bold text-neon-blue">SCOUFF</span>
      </div>
      <nav className="flex flex-col gap-4">
        {canSee("inventory") && (
          <Link href="/dashboard/inventory" className="hover:text-neon-blue font-bold">Inventory</Link>
        )}
        <Link href="/dashboard" className="hover:text-neon-blue">Dashboard</Link>
        {canSee("auctions") && (
          <Link href="/auctions?from=dashboard" className="hover:text-neon-blue">Auctions</Link>
        )}
        {canSee("admin") && (
          <Link href="/admin" className="hover:text-neon-blue">Admin</Link>
        )}
        {canSee("settings") && (
          <Link href="/settings?from=dashboard" className="hover:text-neon-blue">Settings</Link>
        )}
        {normalizedRole === "ceo" && (
          <Link href="/dashboard/founder" className="hover:text-neon-blue">Founder</Link>
        )}
      </nav>
    </aside>
  );
}
