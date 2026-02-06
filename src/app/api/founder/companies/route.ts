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

  const { data: companies } = await supabase.from("companies").select("id, name, slug, created_at");
  const { data: orders } = await supabase
    .from("orders")
    .select("company_id, gross_amount_cents, created_at");
  const { data: pageViews } = await supabase
    .from("page_views")
    .select("company_id, created_at");

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

  const rows = (companies ?? []).map((company) => ({
    id: company.id,
    name: company.name,
    slug: company.slug,
    revenue_30d_cents: revenue30.get(company.id) || 0,
    orders_30d: orders30.get(company.id) || 0,
    traffic_7d: traffic7.get(company.id) || 0,
  }));

  return NextResponse.json({ companies: rows });
}
