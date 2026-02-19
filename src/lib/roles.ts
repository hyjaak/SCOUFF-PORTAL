export type Role = "MEMBER" | "MANAGER" | "CEO";

export function normalizeRole(input?: string | null): Role {
  const value = (input || "").toUpperCase();
  if (value === "SUPER_ADMIN" || value === "CEO") return "CEO";
  if (value === "BUSINESS_OWNER" || value === "OWNER" || value === "ADMIN" || value === "MANAGER") return "MANAGER";
  return "MEMBER";
}

export function isCEO(input?: string | null): boolean {
  return normalizeRole(input) === "CEO";
}

export function isManager(input?: string | null): boolean {
  return normalizeRole(input) === "MANAGER";
}

export function isMember(input?: string | null): boolean {
  return normalizeRole(input) === "MEMBER";
}

export function roleLabel(input?: string | null): string {
  const role = normalizeRole(input);
  if (role === "CEO") return "CEO";
  if (role === "MANAGER") return "MANAGER";
  return "MEMBER";
}
