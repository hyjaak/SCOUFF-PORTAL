import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/company";
import { getProfileRole } from "@/lib/profile";
import { normalizeRole } from "@/lib/permissions";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileRole = await getProfileRole(supabase, user.id);
  const role = normalizeRole(profileRole);

  const active = await getActiveCompanyId(supabase, user.id);
  if (!active.companyId && role !== "ceo") {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const companyId = active.companyId;
  const { data: company } = companyId
    ? await supabase.from("companies").select("id, name, slug").eq("id", companyId).single()
    : { data: null };

  const ordersQuery = companyId
    ? supabase.from("orders").select("id, gross_amount_cents, net_amount_cents").eq("company_id", companyId)
    : supabase.from("orders").select("id, gross_amount_cents, net_amount_cents");

  const { data: orders } = await ordersQuery;
  const orderIds = (orders ?? []).map((o) => o.id).filter(Boolean);

  let items: Array<{ name: string; qty: number; unit_price_cents: number }> = [];
  if (orderIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("name, qty, unit_price_cents")
      .in("order_id", orderIds);
    items = itemsData ?? [];
  }
  const { data: pageViews } = await (companyId
    ? supabase.from("page_views").select("id, visitor_id, path, referrer, created_at").eq("company_id", companyId)
    : supabase.from("page_views").select("id, visitor_id, path, referrer, created_at"));

  const totalGross = (orders ?? []).reduce((sum, row) => sum + (row.gross_amount_cents || 0), 0);
  const totalNet = (orders ?? []).reduce((sum, row) => sum + (row.net_amount_cents || 0), 0);
  const orderCount = (orders ?? []).length;
  const aov = orderCount > 0 ? Math.round(totalGross / orderCount) : 0;

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

  const views = pageViews ?? [];
  const totalVisits = views.length;
  const uniqueVisitors = new Set(views.map((v) => v.visitor_id).filter(Boolean)).size;

  return NextResponse.json({
    company,
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
    },
  });
}
