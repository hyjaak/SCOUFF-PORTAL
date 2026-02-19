export type AppRole = 'CEO' | 'MANAGER' | 'MEMBER';

export function normalizeRole(input?: string | null): AppRole {
  if (!input) return 'MEMBER';
  // normalize common variants and strip punctuation
  const cleaned = String(input).trim().toLowerCase().replace(/[^a-z0-9_ ]+/g, '').replace(/\s+/g, '_');
  if (cleaned === 'super_admin' || cleaned === 'super admin' || cleaned === 'superadmin' || cleaned === 'ceo') return 'CEO';
  if (cleaned === 'business_owner' || cleaned === 'business owner' || cleaned === 'business-owner' || cleaned === 'manager' || cleaned === 'business_owner') return 'MANAGER';
  if (cleaned === 'member' || cleaned === 'member') return 'MEMBER';
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
