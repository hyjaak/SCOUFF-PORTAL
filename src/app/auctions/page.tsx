export const dynamic = "force-dynamic";

import React from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import SmartBackButton from '@/components/SmartBackButton';

export default function AuctionsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0a0e1a]">
      <header className="h-16 bg-[#101a2b] border-b border-blue-900 flex items-center px-8">
        <span className="text-neon-blue text-2xl font-bold">SCOUFF</span>
        <span className="ml-auto text-blue-200">Auctions</span>
      </header>
      <section className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <SmartBackButton />
          </div>
          <div className="bg-[#131c2e] rounded-lg shadow-lg p-6 border border-blue-900 mb-4">
            <div className="text-xl font-semibold text-white mb-2">Rare Artifact</div>
            <div className="text-blue-300 text-sm">Ends: 2026-02-01 12:00</div>
          </div>
          <div className="bg-[#131c2e] rounded-lg shadow-lg p-6 border border-blue-900 mb-4">
            <div className="text-xl font-semibold text-white mb-2">Vintage Car</div>
            <div className="text-blue-300 text-sm">Ends: 2026-02-05 18:00</div>
          </div>
        </div>
      </section>
    </main>
  );
}
