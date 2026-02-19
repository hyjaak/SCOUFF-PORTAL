import { NextResponse } from 'next/server';
import createSupabaseAdmin from '@/lib/supabase/admin';
import getSessionUser from '@/lib/auth/getSessionUser';
import { normalizeRole } from '@/lib/roles';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { user, role } = await getSessionUser();
  const r = normalizeRole(role as string);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (r !== 'CEO' && r !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const supabaseAdmin = await createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('inventory_products').insert([body]).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, ...patch } = body;
  const { user, role } = await getSessionUser();
  const r = normalizeRole(role as string);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (r !== 'CEO' && r !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const supabaseAdmin = await createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('inventory_products').update(patch).eq('id', id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const { user, role } = await getSessionUser();
  const r = normalizeRole(role as string);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (r !== 'CEO' && r !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const supabaseAdmin = await createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('inventory_products').delete().eq('id', id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
