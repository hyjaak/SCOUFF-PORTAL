import React from 'react';
import Link from 'next/link';

export default function Sidebar({ role }: { role: string }) {
  return (
    <aside className="w-64 h-full bg-[#101a2b] border-r border-blue-900 flex flex-col p-6">
      <div className="mb-8">
        <span className="text-2xl font-bold text-neon-blue">SCOUFF</span>
      </div>
      <nav className="flex flex-col gap-4">
        <Link href="/dashboard/inventory" className="hover:text-neon-blue font-bold">Inventory</Link>
        <Link href="/dashboard" className="hover:text-neon-blue">Dashboard</Link>
        <Link href="/auctions?from=dashboard" className="hover:text-neon-blue">Auctions</Link>
        {['ceo', 'SUPER_ADMIN', 'BUSINESS_OWNER'].includes(role) && (
          <Link href="/admin" className="hover:text-neon-blue">Admin</Link>
        )}
        <Link href="/settings?from=dashboard" className="hover:text-neon-blue">Settings</Link>
      </nav>
    </aside>
  );
}
