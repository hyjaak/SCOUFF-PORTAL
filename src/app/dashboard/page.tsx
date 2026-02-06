
import Card from "@/components/Card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveCompanyId } from "@/lib/company";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const active = await getActiveCompanyId(supabase, user.id);
  const companyId = active.companyId;
  const { data: company } = companyId
    ? await supabase.from("companies").select("id, name").eq("id", companyId).single()
    : { data: null };

  const { data: orders } = companyId
    ? await supabase.from("orders").select("gross_amount_cents, net_amount_cents").eq("company_id", companyId)
    : await supabase.from("orders").select("gross_amount_cents, net_amount_cents");

  const totalGross = (orders ?? []).reduce((sum, row) => sum + (row.gross_amount_cents || 0), 0);
  const totalNet = (orders ?? []).reduce((sum, row) => sum + (row.net_amount_cents || 0), 0);
  const orderCount = (orders ?? []).length;
  const aov = orderCount > 0 ? Math.round(totalGross / orderCount) : 0;
  return (
    <div className="w-full max-w-5xl">
      <h1 className="text-3xl font-bold text-sky-400 mb-8">SCOUFF Products Portal</h1>
      <div className="mb-4 text-sky-300 font-medium text-lg">Welcome to your products dashboard.</div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-blue-300 mb-3">Company Overview {company?.name ? `— ${company.name}` : ""}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card title="Gross Revenue" value={`$${(totalGross / 100).toFixed(2)}`} />
          <Card title="Net Revenue" value={`$${(totalNet / 100).toFixed(2)}`} />
          <Card title="Orders" value={orderCount} />
          <Card title="AOV" value={`$${(aov / 100).toFixed(2)}`} />
        </div>
      </div>
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
