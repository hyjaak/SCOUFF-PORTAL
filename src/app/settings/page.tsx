export const dynamic = "force-dynamic";

import React from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';

export default function SettingsPage() {
  // Placeholder user for MVP
  const user = { email: 'admin@scouff.com', role: 'SUPER_ADMIN' };
  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-8 bg-[#0a0e1a]">
          <h1 className="text-3xl font-bold text-neon-blue mb-6">Settings</h1>
          <div className="text-blue-200">Settings page coming soon.</div>
        </main>
      </div>
    </div>
  );
}
