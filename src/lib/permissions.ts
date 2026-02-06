import type { Role } from "@/lib/roles";

export const FEATURE_KEYS = ["inventory", "auctions", "invites", "settings", "admin", "deals"] as const;
export type FeatureKey = typeof FEATURE_KEYS[number];
export type FeatureMap = Record<FeatureKey, boolean>;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  inventory: "Inventory",
  auctions: "Auctions",
  invites: "Invites",
  settings: "Settings",
  admin: "Admin",
  deals: "Deals",
};

export type AppRole = Role;

export function buildFeatureMap(role: AppRole, rows?: Array<{ feature?: string | null; enabled?: boolean | null }>) {
  const base: FeatureMap = {
    inventory: role === "MEMBER",
    auctions: role === "MEMBER",
    invites: false,
    settings: false,
    admin: false,
    deals: false,
  };

  if (role === "CEO") {
    return { ...base, inventory: true, auctions: true, invites: true, settings: true, admin: true, deals: true };
  }

  if (!rows) return base;

  for (const row of rows) {
    const key = row.feature;
    if (!key) continue;
    if (key in base) {
      base[key as FeatureKey] = Boolean(row.enabled);
    }
  }

  return base;
}
