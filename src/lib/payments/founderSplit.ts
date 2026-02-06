import { createServerSupabaseClient } from "@/lib/supabase/server";

// IMPORTANT: DO NOT integrate payments without using computeFounderSplit and writing to payment_splits.

export async function assertFounderSplitConfigured(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("founder_share_rules")
    .select("id, share_bps, enabled")
    .eq("company_id", companyId)
    .eq("enabled", true)
    .limit(1);

  if (error) {
    throw new Error("Failed to load founder share rules");
  }

  const hasRule = (data ?? []).some((row) => (row.share_bps ?? 0) > 0);
  if (process.env.NODE_ENV === "production" && !hasRule) {
    throw new Error("Founder share rule missing or disabled.");
  }
}

export async function computeFounderSplit(companyId: string, grossCents: number) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("compute_split", {
    company: companyId,
    gross_cents: grossCents,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
