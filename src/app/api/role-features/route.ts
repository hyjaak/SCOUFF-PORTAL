import { NextResponse } from 'next/server';
import createSupabaseAdmin from '@/lib/supabase/admin';
import getSessionUser from '@/lib/auth/getSessionUser';
import { normalizeRole } from '@/lib/roles';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = url.searchParams.get('role') || 'MANAGER';
  try {
    const supabaseAdmin = await createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('role_features').select('feature, enabled').eq('role', role.toLowerCase());
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { user, role } = await getSessionUser();
  const r = normalizeRole(role as string);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (r !== 'CEO') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // body: { role: 'MANAGER', feature: 'inventory', enabled: true }
  const payload = { role: (body.role || 'manager').toLowerCase(), feature: body.feature, enabled: !!body.enabled };
  try {
    const supabaseAdmin = await createSupabaseAdmin();
    const { error } = await supabaseAdmin.from('role_features').upsert([payload], { onConflict: 'role,feature' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
