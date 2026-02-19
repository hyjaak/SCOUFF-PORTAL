export type AppRole = 'CEO' | 'MANAGER' | 'MEMBER';

export function normalizeRole(input?: string | null): AppRole {
  if (!input) return 'MEMBER';
  const s = String(input).trim().toLowerCase();
  if (s === 'super_admin' || s === 'super admin' || s === 'superadmin' || s === 'ceo') return 'CEO';
  if (s === 'business_owner' || s === 'business owner' || s === 'business-owner' || s === 'manager') return 'MANAGER';
  if (s === 'member' || s === 'member') return 'MEMBER';
  return 'MEMBER';
}

export function isCEO(input?: string | AppRole | null): boolean {
  return normalizeRole(input as string) === 'CEO';
}

export function isManager(input?: string | AppRole | null): boolean {
  return normalizeRole(input as string) === 'MANAGER';
}

export function roleLabel(role: AppRole | string | null | undefined): string {
  return normalizeRole(role as string);
}

export function toDbRole(role: string): string {
  const r = normalizeRole(role as string);
  if (r === 'CEO') return 'super_admin';
  if (r === 'MANAGER') return 'manager';
  return 'member';
}

export default {} as const;
