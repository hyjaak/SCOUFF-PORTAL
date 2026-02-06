export type AppRole = "ceo" | "manager" | "member";

export const ROLE_VALUES = {
  CEO: "super_admin",
  MANAGER: "manager",
  MEMBER: "member",
} as const;

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

export function normalizeRole(role?: string | null): AppRole {
  const value = (role || "").toLowerCase();
  if (value === "super_admin" || value === "ceo") return "ceo";
  if (value === "business_owner" || value === "admin" || value === "manager") return "manager";
  return "member";
}

export function displayRole(role?: string | null): string {
  const value = (role || "").toLowerCase();
  if (value === "super_admin" || value === "ceo") return "Super Admin";
  if (value === "business_owner" || value === "admin" || value === "manager") return "Manager";
  return "Member";
}

export function buildFeatureMap(role: AppRole, rows?: Array<{ feature?: string | null; enabled?: boolean | null }>) {
  const base: FeatureMap = {
    inventory: false,
    auctions: false,
    invites: false,
    settings: false,
    admin: false,
    deals: false,
  };

  if (role === "ceo") {
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
