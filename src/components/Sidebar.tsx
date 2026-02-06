 "use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isCEO, isManager, normalizeRole } from '@/lib/roles';

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const normalizedRole = normalizeRole(role);
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href;

  const canSeeManager = isManager(normalizedRole) || isCEO(normalizedRole);
  const canSeeCeo = isCEO(normalizedRole);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="md:hidden fixed top-4 left-4 z-50 px-3 py-2 rounded bg-[#101a2b] border border-blue-900 text-blue-200"
        aria-label="Toggle navigation"
      >
        {open ? "Close" : "Menu"}
      </button>
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-[#101a2b] border-r border-blue-900 flex flex-col p-6 transform transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} md:flex`}
      >
      <div className="mb-8">
        <span className="text-2xl font-bold text-neon-blue">SCOUFF</span>
      </div>
      <nav className="flex flex-col gap-4">
        <Link href="/dashboard" className={`hover:text-neon-blue ${isActive("/dashboard") ? "text-neon-blue font-bold" : ""}`}>Dashboard</Link>
        <Link href="/dashboard/products" className={`hover:text-neon-blue ${isActive("/dashboard/products") ? "text-neon-blue font-bold" : ""}`}>Products</Link>
        <Link href="/dashboard/auctions" className={`hover:text-neon-blue ${isActive("/dashboard/auctions") ? "text-neon-blue font-bold" : ""}`}>Auctions</Link>
        {canSeeManager && (
          <Link href="/dashboard/settings" className={`hover:text-neon-blue ${isActive("/dashboard/settings") ? "text-neon-blue font-bold" : ""}`}>Settings</Link>
        )}
        {canSeeManager && (
          <Link href="/dashboard/admin" className={`hover:text-neon-blue ${isActive("/dashboard/admin") ? "text-neon-blue font-bold" : ""}`}>Admin</Link>
        )}
        {canSeeCeo && (
          <Link href="/dashboard/founder" className={`hover:text-neon-blue ${isActive("/dashboard/founder") ? "text-neon-blue font-bold" : ""}`}>
            Founder <span className="ml-2 text-[10px] uppercase tracking-widest bg-blue-800 text-blue-100 px-1.5 py-0.5 rounded">CEO</span>
          </Link>
        )}
      </nav>
    </aside>
    </>
  );
}
