import { cookies } from "next/headers";

type SupabaseClientLike = {
  from: (table: string) => any;
};

export async function getActiveCompanyId(supabase: SupabaseClientLike, userId: string) {
  const cookieStore = await cookies();
  const cookieCompany = cookieStore.get("scouff_company")?.value || "";

  if (cookieCompany) {
    try {
      const { data } = await supabase
        .from("company_members")
        .select("company_id, role")
        .eq("company_id", cookieCompany)
        .eq("user_id", userId)
        .single();
      if (data?.company_id) {
        return { companyId: data.company_id as string, role: (data.role as string) || "member" };
      }
    } catch {
      // ignore and fall back
    }
  }

  try {
    const { data } = await supabase
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", userId)
      .limit(1)
      .single();
    if (data?.company_id) {
      return { companyId: data.company_id as string, role: (data.role as string) || "member" };
    }
  } catch {
    // ignore
  }

  return { companyId: null, role: "member" };
}
