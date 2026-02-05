import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function createInvite(email: string, role: string, createdBy: string) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // 3 days
  const { data, error } = await supabase.from('invites').insert([
    { email, role, token, expires_at: expiresAt.toISOString(), created_by: createdBy },
  ]);
  if (error) throw error;
  return token;
}

export async function acceptInvite(token: string, password: string) {
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .single();
  if (inviteError || !invite) throw new Error('Invalid or expired invite');
  if (invite.used_at) throw new Error('Invite already used');
  const { data: user, error: userError } = await supabase.auth.signUp({
    email: invite.email,
    password,
  });
  if (userError) throw userError;
  if (!user.user) throw new Error('Sign up failed');
  await supabase.from('users').insert([
    { id: user.user.id, email: invite.email, role: invite.role },
  ]);
  await supabase.from('invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);
  return user;
}
