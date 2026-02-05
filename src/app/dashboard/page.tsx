

export default function DashboardPage() {
  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-3xl font-bold text-sky-400 mb-8">SCOUFF Products Portal</h1>
      <div className="mb-4 text-sky-300 font-medium text-lg">Welcome to your products dashboard.</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#131c2e] rounded-xl border border-blue-900 p-6 text-sky-400 font-bold text-xl">Products: 8</div>
        <div className="bg-[#131c2e] rounded-xl border border-blue-900 p-6 text-sky-400 font-bold text-xl">Active Members: 12</div>
        <div className="bg-[#131c2e] rounded-xl border border-blue-900 p-6 text-sky-400 font-bold text-xl">System Status: OK</div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-[#131c2e] rounded-xl border border-blue-900 p-8 text-white font-semibold text-2xl mb-0">Products Panel (coming soon)</div>
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-[#131c2e] rounded-xl border border-blue-900 p-6 text-sky-400 font-bold text-lg">Invites (CEO only)</div>
          <div className="bg-[#131c2e] rounded-xl border border-blue-900 p-6 text-sky-400 font-bold text-lg">Auctions (secondary)</div>
        </div>
      </div>
    </div>
  );
}
