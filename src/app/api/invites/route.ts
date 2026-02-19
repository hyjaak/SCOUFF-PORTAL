import { NextResponse } from 'next/server';
import createSupabaseAdmin from '@/lib/supabase/admin';
import getSessionUser from '@/lib/auth/getSessionUser';
import { normalizeRole } from '@/lib/roles';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const supabaseAdmin = await createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('invites').select('*').order('created_at', { ascending: false }).limit(200);
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
  if (r !== 'CEO' && r !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const code = uuidv4();
  const mapToDbRole = (r: any) => {
    if (!r) return 'member';
    const s = String(r).toLowerCase();
    if (s === 'member') return 'member';
    if (s === 'manager' || s === 'business_owner') return 'manager';
    if (s === 'ceo' || s === 'super_admin' || s === 'super admin') return 'super_admin';
    return s;
  };
  const payload = { email: body.email || null, role: mapToDbRole(body.role), code, created_by: user.id };
  try {
    const supabaseAdmin = await createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('invites').insert([payload]).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
