import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/company";
import crypto from "crypto";

function hashIp(ip: string, salt: string) {
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let body: { path?: string; referrer?: string; visitorId?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const path = typeof body.path === "string" ? body.path : "/";
  const referrer = typeof body.referrer === "string" ? body.referrer : "";
  const visitorId = typeof body.visitorId === "string" ? body.visitorId : null;

  const headers = req.headers;
  const ip = (headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const salt = process.env.TRACKING_SALT || "scouff";
  const ipHash = ip ? hashIp(ip, salt) : null;
  const userAgent = headers.get("user-agent") || null;

  let companyId: string | null = null;
  let companyRole = "member";
  if (user) {
    const active = await getActiveCompanyId(supabase, user.id);
    companyId = active.companyId;
    companyRole = active.role;
  }

  await supabase.from("page_views").insert([
    {
      company_id: companyId,
      path,
      referrer,
      user_agent: userAgent,
      ip_hash: ipHash,
      visitor_id: visitorId,
      user_id: user?.id ?? null,
    },
  ]);

  const res = NextResponse.json({ ok: true });
  if (user && companyId && !req.headers.get("cookie")?.includes("scouff_company=")) {
    res.cookies.set("scouff_company", companyId, { httpOnly: false, sameSite: "lax", path: "/" });
  }

  return res;
}
