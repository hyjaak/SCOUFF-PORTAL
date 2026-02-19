 "use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isCEO, isManager, normalizeRole } from '@/lib/roles';
import NAV_ITEMS from '@/lib/nav';

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const normalizedRole = normalizeRole(role);
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href;

  const canSeeManager = isManager(normalizedRole);
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
        {NAV_ITEMS.map((item) => {
          const allowed = item.rolesAllowed.includes(normalizedRole);
          if (!allowed) return null;
          return (
            <Link key={item.href} href={item.href} className={`hover:text-neon-blue ${isActive(item.href) ? "text-neon-blue font-bold" : ""}`}>{item.label}</Link>
          );
        })}
      </nav>
    </aside>
    </>
  );
}
