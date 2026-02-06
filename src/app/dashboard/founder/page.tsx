import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/profile";
import { normalizeRole, isCEO } from "@/lib/roles";
import Card from "@/components/Card";

export default async function FounderDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileRole = await getProfileRole(supabase, user.id);
  if (!isCEO(normalizeRole(profileRole))) redirect("/dashboard");

  const { data: orders } = await supabase
    .from("orders")
    .select("company_id, gross_amount_cents, net_amount_cents, created_at");
  const { data: pageViews } = await supabase
    .from("page_views")
    .select("company_id, visitor_id, path, referrer, created_at");
  const { data: companies } = await supabase.from("companies").select("id, name, slug");
  const { data: items } = await supabase
    .from("order_items")
    .select("name, qty, unit_price_cents");

  const totalGross = (orders ?? []).reduce((sum, row) => sum + (row.gross_amount_cents || 0), 0);
  const totalNet = (orders ?? []).reduce((sum, row) => sum + (row.net_amount_cents || 0), 0);
  const orderCount = (orders ?? []).length;
  const aov = orderCount > 0 ? Math.round(totalGross / orderCount) : 0;

  const views = pageViews ?? [];
  const totalVisits = views.length;
  const uniqueVisitors = new Set(views.map((v) => v.visitor_id).filter(Boolean)).size;

  const productMap = new Map<string, { name: string; revenue_cents: number; qty: number }>();
  for (const item of items ?? []) {
    const name = item.name || "Unknown";
    const qty = item.qty || 0;
    const revenue = (item.qty || 0) * (item.unit_price_cents || 0);
    const existing = productMap.get(name);
    if (existing) {
      existing.revenue_cents += revenue;
      existing.qty += qty;
    } else {
      productMap.set(name, { name, revenue_cents: revenue, qty });
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue_cents - a.revenue_cents)
    .slice(0, 5);

  const now = Date.now();
  const days30 = now - 30 * 864e5;
  const days7 = now - 7 * 864e5;

  const revenue30 = new Map<string, number>();
  const orders30 = new Map<string, number>();
  for (const order of orders ?? []) {
    if (!order.company_id) continue;
    const createdAt = new Date(order.created_at).getTime();
    if (createdAt >= days30) {
      revenue30.set(order.company_id, (revenue30.get(order.company_id) || 0) + (order.gross_amount_cents || 0));
      orders30.set(order.company_id, (orders30.get(order.company_id) || 0) + 1);
    }
  }

  const traffic7 = new Map<string, number>();
  for (const view of pageViews ?? []) {
    if (!view.company_id) continue;
    const createdAt = new Date(view.created_at).getTime();
    if (createdAt >= days7) {
      traffic7.set(view.company_id, (traffic7.get(view.company_id) || 0) + 1);
    }
  }

  const companyRows = (companies ?? []).map((company) => ({
    id: company.id,
    name: company.name,
    slug: company.slug,
    revenue_30d_cents: revenue30.get(company.id) || 0,
    orders_30d: orders30.get(company.id) || 0,
    traffic_7d: traffic7.get(company.id) || 0,
  }));

  const { data: trafficRowsData } = await supabase
    .from("v_company_traffic_daily")
    .select("company_id, day, page_views, uniques_estimate")
    .order("day", { ascending: true })
    .limit(14);
  const trafficRows = trafficRowsData ?? [];

  return (
    <div className="w-full max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-sky-400">Founder Overview</h1>
        <div className="text-blue-200 text-sm">Global view</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card title="Total Revenue (Gross)" value={`$${(totalGross / 100).toFixed(2)}`} />
        <Card title="Total Revenue (Net)" value={`$${(totalNet / 100).toFixed(2)}`} />
        <Card title="Total Orders" value={orderCount} />
        <Card title="AOV" value={`$${(aov / 100).toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card title="Total Visits" value={totalVisits} />
        <Card title="Unique Visitors" value={uniqueVisitors} />
        <Card title="Top Products" value={topProducts.length} />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-blue-300 mb-2">Revenue by Company</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#131c2e] rounded-lg shadow border border-blue-900">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-blue-300">Company</th>
                <th className="px-4 py-2 text-left text-blue-300">Revenue (30d)</th>
                <th className="px-4 py-2 text-left text-blue-300">Orders (30d)</th>
                <th className="px-4 py-2 text-left text-blue-300">Traffic (7d)</th>
              </tr>
            </thead>
            <tbody>
              {companyRows.map((row: { id: string; name: string; revenue_30d_cents: number; orders_30d: number; traffic_7d: number }) => (
                <tr key={row.id} className="border-t border-blue-900/40">
                  <td className="px-4 py-2 text-white">{row.name}</td>
                  <td className="px-4 py-2 text-white">${(row.revenue_30d_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-2 text-white">{row.orders_30d}</td>
                  <td className="px-4 py-2 text-white">{row.traffic_7d}</td>
                </tr>
              ))}
              {companyRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-blue-200">No companies found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-blue-300 mb-2">Top Products</h2>
        <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-4 text-blue-200 text-sm">
          {topProducts.length === 0 ? (
            <div>No product sales yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topProducts.map((product) => (
                <div key={product.name} className="flex items-center justify-between border border-blue-900/40 rounded px-3 py-2">
                  <div>{product.name}</div>
                  <div>${(product.revenue_cents / 100).toFixed(2)} ({product.qty})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-blue-300 mb-2">Traffic by Day (7d)</h2>
        <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-4 text-blue-200 text-sm">
          {trafficRows.length === 0 ? (
            <div>No traffic data yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trafficRows.map((row: { company_id: string; day: string; page_views: number; uniques_estimate: number }, idx: number) => (
                <div key={`${row.company_id}-${idx}`} className="flex items-center justify-between border border-blue-900/40 rounded px-3 py-2">
                  <div>{new Date(row.day).toLocaleDateString()}</div>
                  <div>{row.page_views} views / {row.uniques_estimate} uniques</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
