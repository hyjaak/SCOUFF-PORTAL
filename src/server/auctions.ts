import { supabase } from '../lib/supabase';

export async function createAuction(title: string, description: string, endsAt: string, createdBy: string) {
  const { data, error } = await supabase.from('auctions').insert([
    { title, description, ends_at: endsAt, created_by: createdBy },
  ]);
  if (error) throw error;
  return data;
}

export async function listAuctions() {
  const { data, error } = await supabase.from('auctions').select('*').order('ends_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAuction(id: string) {
  const { data, error } = await supabase.from('auctions').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
