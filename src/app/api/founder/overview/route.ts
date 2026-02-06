import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/profile";
import { normalizeRole } from "@/lib/permissions";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileRole = await getProfileRole(supabase, user.id);
  if (normalizeRole(profileRole) !== "ceo") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("gross_amount_cents, net_amount_cents");

  const totalGross = (orders ?? []).reduce((sum, row) => sum + (row.gross_amount_cents || 0), 0);
  const totalNet = (orders ?? []).reduce((sum, row) => sum + (row.net_amount_cents || 0), 0);
  const orderCount = (orders ?? []).length;
  const aov = orderCount > 0 ? Math.round(totalGross / orderCount) : 0;

  const { data: items } = await supabase
    .from("order_items")
    .select("name, qty, unit_price_cents");

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

  const { data: pageViews } = await supabase
    .from("page_views")
    .select("id, visitor_id, path, referrer, created_at");

  const views = pageViews ?? [];
  const totalVisits = views.length;
  const uniqueVisitors = new Set(views.map((v) => v.visitor_id).filter(Boolean)).size;
  const topPagesMap = new Map<string, number>();
  const referrersMap = new Map<string, number>();
  for (const view of views) {
    const path = view.path || "/";
    topPagesMap.set(path, (topPagesMap.get(path) || 0) + 1);
    if (view.referrer) {
      referrersMap.set(view.referrer, (referrersMap.get(view.referrer) || 0) + 1);
    }
  }
  const topPages = Array.from(topPagesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, count]) => ({ path, count }));
  const topReferrers = Array.from(referrersMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([referrer, count]) => ({ referrer, count }));

  return NextResponse.json({
    totals: {
      gross_cents: totalGross,
      net_cents: totalNet,
      orders: orderCount,
      aov_cents: aov,
    },
    top_products: topProducts,
    traffic: {
      total_visits: totalVisits,
      unique_visitors: uniqueVisitors,
      top_pages: topPages,
      top_referrers: topReferrers,
    },
  });
}
