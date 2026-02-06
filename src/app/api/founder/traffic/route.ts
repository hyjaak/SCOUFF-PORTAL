import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/profile";
import { normalizeRole, isCEO } from "@/lib/roles";

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileRole = await getProfileRole(supabase, user.id);
  if (!isCEO(normalizeRole(profileRole))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "7d";
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 7;
  const since = new Date(Date.now() - days * 864e5).toISOString();

  const { data } = await supabase
    .from("v_company_traffic_daily")
    .select("company_id, day, page_views, uniques_estimate")
    .gte("day", since)
    .order("day", { ascending: true });

  return NextResponse.json({ range, rows: data ?? [] });
}
