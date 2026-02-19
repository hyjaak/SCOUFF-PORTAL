export const dynamic = "force-dynamic";

import React from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import FormField from '../../components/FormField';
import InvitesClient from '@/app/dashboard/invites/InvitesClient';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildFeatureMap } from '@/lib/permissions';
import { normalizeRole, isCEO } from '@/lib/roles';
import { redirect } from 'next/navigation';
import { getProfileRole } from '@/lib/profile';

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profileRole = await getProfileRole(supabase, user.id);
  const normalizedRole = normalizeRole(profileRole);
  let featureRows: Array<{ feature?: string | null; enabled?: boolean | null }> = [];
  if (!isCEO(normalizedRole)) {
    const { data } = await supabase
      .from("role_feature_permissions")
      .select("feature, enabled")
      .eq("role", normalizedRole.toLowerCase());
    featureRows = data ?? [];
  }
  const currentFeatures = buildFeatureMap(normalizedRole, featureRows);

  if (!isCEO(normalizedRole) && !currentFeatures.admin) {
    redirect("/dashboard");
  }

  const displayUser = { email: user.email ?? "", role: normalizedRole };
  return (
    <div className="flex min-h-screen">
      <Sidebar role={displayUser.role} />
      <div className="flex-1 flex flex-col">
        <Topbar user={displayUser} />
        <main className="flex-1 p-8 bg-[#0a0e1a] max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-neon-blue mb-6">Admin Panel</h1>
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-blue-300 mb-2">Invites</h2>
            {/* Client component handles invite creation and listing */}
            <InvitesClient invites={(await (async () => { const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false }).limit(200); return data ?? []; })())} />
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
