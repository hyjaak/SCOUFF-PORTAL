import React from 'react';
import Sidebar from '../../../components/Sidebar';
import Topbar from '../../../components/Topbar';
import FormField from '../../../components/FormField';

export default function AuctionDetailPage() {
  // Placeholder user and auction for MVP
  const user = { email: 'admin@scouff.com', role: 'ceo' };
  const auction = { id: '1', title: 'Rare Artifact', description: 'A unique item.', ends_at: '2026-02-01T12:00:00Z' };
  const bids = [
    { user_id: '1', amount: 100, created_at: '2026-01-28T10:00:00Z' },
    { user_id: '2', amount: 150, created_at: '2026-01-28T11:00:00Z' },
  ];
  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-8 bg-[#0a0e1a] max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-neon-blue mb-2">{auction.title}</h1>
          <div className="text-blue-200 mb-4">{auction.description}</div>
          <div className="text-blue-400 mb-8">Ends: {new Date(auction.ends_at).toLocaleString()}</div>
          <form className="mb-8 bg-[#131c2e] p-6 rounded-lg border border-blue-900 flex flex-col gap-4">
            <FormField label="Your Bid">
              <input type="number" min={0} className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white w-full" required />
            </FormField>
            <button type="submit" className="bg-blue-700 hover:bg-blue-900 text-white font-semibold py-2 rounded transition">Place Bid</button>
          </form>
          <div>
            <h2 className="text-xl font-semibold text-blue-300 mb-2">Bid History</h2>
            <ul className="space-y-2">
              {bids.map((b, i) => (
                <li key={i} className="flex justify-between bg-[#101a2b] p-3 rounded border border-blue-900">
                  <span className="text-blue-200">User {b.user_id}</span>
                  <span className="text-white font-bold">${b.amount}</span>
                  <span className="text-blue-400 text-xs">{new Date(b.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
