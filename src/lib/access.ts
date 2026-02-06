import { normalizeRole, type Role } from "@/lib/roles";

const MEMBER_ALLOWED = new Set<string>([
  "/dashboard",
  "/dashboard/products",
  "/dashboard/auctions",
]);

const MANAGER_ALLOWED = new Set<string>([
  ...MEMBER_ALLOWED,
  "/dashboard/settings",
  "/dashboard/admin",
]);

export function canAccess(role: Role | string | null | undefined, pathname: string): boolean {
  const normalized = normalizeRole(role ?? undefined);
  if (normalized === "CEO") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  if (normalized === "MANAGER") {
    return MANAGER_ALLOWED.has(pathname);
  }
  return MEMBER_ALLOWED.has(pathname);
}
