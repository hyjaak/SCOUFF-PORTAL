import React, { Suspense } from 'react';
import SmartBackButton from '@/components/SmartBackButton';

export default function Topbar({ user }: { user: { email: string; role: string } }) {
  return (
    <header className="w-full h-16 bg-[#101a2b] border-b border-blue-900 flex items-center px-8 justify-between">
      <div className="flex items-center gap-3">
        <Suspense fallback={null}>
          <SmartBackButton />
        </Suspense>
        <div className="text-blue-200 opacity-60">Search (coming soon)</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-blue-300 font-semibold">{user.email}</span>
        <span className="px-2 py-1 rounded bg-blue-800 text-xs text-blue-100 uppercase">{user.role}</span>
      </div>
    </header>
  );
}
