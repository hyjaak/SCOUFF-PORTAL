import { supabase } from '../lib/supabase';

export async function submitBid(auctionId: string, userId: string, amount: number) {
  // Get current highest bid
  const { data: highest, error: highestError } = await supabase
    .from('bids')
    .select('amount')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(1)
    .single();
  if (highestError && highestError.code !== 'PGRST116') throw highestError;
  if (highest && amount <= highest.amount) throw new Error('Bid must be higher than current highest');
  // Check auction not ended
  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select('ends_at')
    .eq('id', auctionId)
    .single();
  if (auctionError) throw auctionError;
  if (new Date(auction.ends_at) < new Date()) throw new Error('Auction ended');
  // Insert bid
  const { data, error } = await supabase.from('bids').insert([
    { auction_id: auctionId, user_id: userId, amount },
  ]);
  if (error) throw error;
  return data;
}

export async function getBids(auctionId: string) {
  const { data, error } = await supabase
    .from('bids')
    .select('amount, user_id, created_at')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false });
  if (error) throw error;
  return data;
}
