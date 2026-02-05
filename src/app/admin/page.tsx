import React from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import FormField from '../../components/FormField';

export default function AdminPage() {
  // Placeholder user for MVP
  const user = { email: 'admin@scouff.com', role: 'SUPER_ADMIN' };
  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-8 bg-[#0a0e1a] max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-neon-blue mb-6">Admin Panel</h1>
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-blue-300 mb-2">Create Invite</h2>
            <form className="bg-[#131c2e] p-6 rounded-lg border border-blue-900 flex flex-col gap-4">
              <FormField label="Email">
                <input type="email" className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white w-full" required />
              </FormField>
              <FormField label="Role">
                <select className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white w-full">
                  <option value="MEMBER">Member</option>
                  <option value="BUSINESS_OWNER">Business Owner</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </FormField>
              <button type="submit" className="bg-blue-700 hover:bg-blue-900 text-white font-semibold py-2 rounded transition">Create Invite</button>
            </form>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-blue-300 mb-2">Create Auction</h2>
            <form className="bg-[#131c2e] p-6 rounded-lg border border-blue-900 flex flex-col gap-4">
              <FormField label="Title">
                <input type="text" className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white w-full" required />
              </FormField>
              <FormField label="Description">
                <textarea className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white w-full" required />
              </FormField>
              <FormField label="End Time">
                <input type="datetime-local" className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white w-full" required />
              </FormField>
              <button type="submit" className="bg-blue-700 hover:bg-blue-900 text-white font-semibold py-2 rounded transition">Create Auction</button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
