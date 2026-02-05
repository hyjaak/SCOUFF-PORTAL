import React from 'react';

export default function AcceptInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
      <form className="bg-[#131c2e] p-8 rounded-lg shadow-lg border border-blue-900 w-96 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-neon-blue mb-2">Accept Invite</h2>
        <label className="flex flex-col gap-1">
          <span className="text-blue-200">Set Password</span>
          <input type="password" className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white" required />
        </label>
        <button type="submit" className="bg-blue-700 hover:bg-blue-900 text-white font-semibold py-2 rounded transition">Create Account</button>
      </form>
    </main>
  );
}
